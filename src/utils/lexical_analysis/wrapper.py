import sys
import json
import os
import re
import io

try:
    import spacy
except ImportError:
    # If spacy is missing, print a JSON error and exit immediately
    print(json.dumps({"error": "Module 'spacy' not found. Please install it."}))
    sys.exit(0)

# Force UTF-8 for communication with Node.js
if sys.version_info >= (3, 7):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stdin.reconfigure(encoding='utf-8')
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')

from lexical_diversity import lex_div as ld

# Academic Word List (AWL) - Tier 2 and Tier 3 samples
ACADEMIC_WORDS = {
    "analyze", "consequently", "sustainable", "approach", "assessment", "assume", "authority", 
    "available", "benefit", "concept", "consistent", "constitutional", "context", "create", 
    "data", "definition", "derived", "distribution", "economic", "environment", "established", 
    "estimate", "evidence", "export", "factors", "financial", "formula", "function", "identified", 
    "income", "indicate", "individual", "interpretation", "involved", "issues", "labour", "legal", 
    "legislation", "major", "method", "occur", "percent", "period", "policy", "principle", 
    "procedure", "process", "required", "research", "response", "role", "section", "sector", 
    "significant", "similar", "source", "specific", "structure", "theory", "variables",
    "achieve", "acquisition", "administration", "affect", "appropriate", "aspects", "assistance", 
    "categories", "chapter", "commission", "community", "complex", "computer", "conclusion", 
    "conduct", "consequences", "construction", "consumer", "credit", "cultural", "design", 
    "distinction", "elements", "equation", "evaluation", "features", "final", "focus", "impact", 
    "injury", "institute", "investment", "items", "journal", "maintenance", "normal", "obtained", 
    "participation", "perceive", "positive", "potential", "previous", "primary", "purchase", 
    "range", "region", "relevant", "restricted", "security", "select", "site", "strategies", 
    "survey", "text", "traditional", "transfer"
}

NON_VERBAL_SOUNDS = {"ssshh", "umm", "ah", "er", "uh", "huh", "hmm"}

def clean_transcript(text):
    """Filter out non-verbal sounds and punctuation."""
    # Remove punctuation
    text = re.sub(r'[^\w\s]', '', text)
    # Tokenize and filter noise
    tokens = text.lower().split()
    cleaned_tokens = [t for t in tokens if t not in NON_VERBAL_SOUNDS]
    return " ".join(cleaned_tokens)

def calculate_density(doc):
    """
    Calculate Lexical Density: percentage of content words.
    Content words = Nouns, Verbs, Adjectives, Adverbs (excluding auxiliary verbs)
    """
    content_tags = {"NOUN", "VERB", "ADJ", "ADV", "PROPN"}
    content_count = sum(1 for token in doc if token.pos_ in content_tags and not token.is_stop)
    total_count = len([t for t in doc if not t.is_punct and not t.is_space])
    return (content_count / total_count * 100) if total_count > 0 else 0

def calculate_sophistication(tokens):
    """
    Calculate Lexical Sophistication: percentage of words in AWL.
    """
    if not tokens:
        return 0
    academic_count = sum(1 for token in tokens if token.lower() in ACADEMIC_WORDS)
    return (academic_count / len(tokens) * 100)

def analyze_text(input_data, suggested_words=None):
    try:
        if not input_data:
            return {"error": "No input text provided"}

        cleaned_text = clean_transcript(input_data)
        word_count = len(cleaned_text.split())

        if word_count < 5:
            return {"status": "insufficient_data"}

        # Load SpaCy model
        try:
            nlp = spacy.load("en_core_web_sm")
        except Exception:
            return {"error": "SpaCy model 'en_core_web_sm' not found. Please run 'python -m spacy download en_core_web_sm'"}

        # Process text
        doc = nlp(cleaned_text)
        tokens_text = [t.text.lower() for t in doc if not t.is_punct and not t.is_space]
        
        # Calculate Lexical Density
        density = calculate_density(doc)

        # Calculate Lexical Diversity (MTLD)
        try:
            # MTLD normalized for length
            if len(tokens_text) < 10:
                # For very short texts, use a dampened TTR
                mtld_score = (len(set(tokens_text)) / (len(tokens_text) + 5)) * 100
            else:
                mtld_score = ld.mtld(tokens_text)
        except Exception:
            mtld_score = (len(set(tokens_text)) / len(tokens_text) * 100) if tokens_text else 0

        # Calculate Lexical Sophistication
        sophistication = calculate_sophistication(tokens_text)

        # Highlighted transcript generation
        suggested_set = set(w.lower() for w in suggested_words) if suggested_words else set()
        highlighted_transcript = []
        
        # Simple repetitive word detection (words appearing > 3 times if they are content words, or > 5 if functional)
        word_freq = {}
        for w in tokens_text:
            word_freq[w] = word_freq.get(w, 0) + 1
            
        for token in doc:
            if token.is_punct or token.is_space:
                continue
                
            word_lower = token.text.lower()
            word_type = "normal"
            
            if word_lower in suggested_set:
                word_type = "tier3"
            elif word_lower in ACADEMIC_WORDS:
                word_type = "academic"
            elif word_freq.get(word_lower, 0) > 4: # Repetitive
                word_type = "filler"
                
            highlighted_transcript.append({
                "word": token.text,
                "type": word_type
            })
                
        # Match detection for suggested words
        matches = sorted(list(set(w for w in tokens_text if w in suggested_set)))

        # Academic words found
        advanced_words_found = sorted(list(set(w for w in tokens_text if w in ACADEMIC_WORDS)))

        # Return Results
        return {
            "status": "success",
            "lexicalDensity": round(density, 2),
            "mtldScore": round(mtld_score, 2),
            "lexicalSophistication": round(sophistication, 2),
            "matches": matches,
            "advancedWords": advanced_words_found,
            "wordCount": word_count,
            "highlightedTranscript": highlighted_transcript,
            "advice": "Excellent variety! Try to incorporate more academic connectors like 'consequently' or 'furthermore' to bridge your ideas." if sophistication < 10 else "Sophisticated vocabulary usage! Focus on maintaining this level of precision throughout your speech."
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    input_text = ""
    suggested_words = []

    # Try to parse JSON from stdin if possible
    try:
        raw_input = sys.stdin.read().strip()
        if raw_input.startswith('{'):
            data = json.loads(raw_input)
            input_text = data.get("text", "")
            suggested_words = data.get("suggested_words", [])
        else:
            input_text = raw_input
    except:
        if len(sys.argv) > 1:
            input_text = sys.argv[1]

    if input_text:
        results = analyze_text(input_text, suggested_words)
        print(json.dumps(results))
    else:
        print(json.dumps({"error": "No input provided"}))
