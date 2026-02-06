import sys
import json
import os
import spacy
from taaled import ld

def calculate_density(tokens):
    """
    Calculate Lexical Density: percentage of content words.
    Content words = Nouns, Verbs, Adjectives, Adverbs (excluding auxiliary verbs)
    """
    content_tags = {"NOUN", "VERB", "ADJ", "ADV", "PROPN"}
    content_count = sum(1 for token in tokens if token.pos_ in content_tags)
    total_count = len([t for t in tokens if not t.is_punct])
    return (content_count / total_count * 100) if total_count > 0 else 0

def calculate_sophistication(tokens):
    """
    Calculate Lexical Sophistication: percentage of advanced words.
    For this MVP, we define advanced words as those > 7 characters and not common.
    """
    common_words = {"the", "and", "a", "to", "of", "in", "i", "is", "it", "you", "that", "for", "on", "was", "with", "as", "at", "be", "this", "have"}
    advanced_count = sum(1 for token in tokens if len(token.text) > 7 and token.text.lower() not in common_words and not token.is_punct)
    total_count = len([t for t in tokens if not t.is_punct])
    return (advanced_count / total_count * 100) if total_count > 0 else 0

def run_analysis():
    try:
        # 1. Read input from stdin
        input_data = sys.stdin.read().strip()
        if not input_data:
            print(json.dumps({"error": "No input text provided"}))
            return

        # 2. Load SpaCy model
        try:
            nlp = spacy.load("en_core_web_sm")
        except Exception:
            # Try to download if missing, but for now we expect it to be there
            print(json.dumps({"error": "SpaCy model 'en_core_web_sm' not found. Please run 'python -m spacy download en_core_web_sm'"}))
            return

        # 3. Process text
        doc = nlp(input_data)
        tokens_text = [t.text for t in doc if not t.is_punct]
        
        # 4. Calculate Lexical Density
        density = calculate_density(doc)

        # 5. Calculate Lexical Diversity (MTLD)
        lexdiv_obj = ld.lexdiv()
        try:
            # MTLD requires at least some minimum number of tokens
            mtld_score = lexdiv_obj.MTLD(tokens_text) if len(tokens_text) > 10 else (len(set(tokens_text)) / len(tokens_text) * 100 if tokens_text else 0)
        except Exception:
            # Fallback to TTR normalized to 100
            mtld_score = (len(set(tokens_text)) / len(tokens_text) * 100) if tokens_text else 0

        # 6. Calculate Lexical Sophistication
        sophistication = calculate_sophistication(doc)

        # 7. Return Results
        result = {
            "lexical_density": round(density, 2),
            "lexical_diversity": round(mtld_score, 2),
            "lexical_sophistication": round(sophistication, 2)
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    run_analysis()
