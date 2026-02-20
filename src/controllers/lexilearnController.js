const axios = require('axios');
const fsExtra = require('fs-extra');
const SpeakingSubmission = require('../models/SpeakingSubmission');
const PracticeSession = require('../models/PracticeSession');
const Student = require('../models/Student');
const Conversation = require('../models/Conversation');
const { successResponse } = require('../utils/helpers');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Helper to spawn Python process and communicate via stdin/stdout
 */
function executePythonBridge(data) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../utils/lexical_analysis/wrapper.py');
        const pythonProcess = spawn('python3', [scriptPath]);

        let stdoutData = '';
        let stderrData = '';

        pythonProcess.stdout.setEncoding('utf8');
        pythonProcess.stderr.setEncoding('utf8');

        pythonProcess.stdout.on('data', (d) => {
            stdoutData += d;
        });

        pythonProcess.stderr.on('data', (d) => {
            stderrData += d;
            console.error(`🐍 Python Stderr: ${d}`);
        });

        pythonProcess.on('error', (err) => {
            console.error('❌ Failed to start Python process:', err);
            reject(new Error(`Failed to start Python analysis: ${err.message}`));
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Python script exited with code ${code}. Stderr: ${stderrData}`));
            }
            try {
                const jsonMatch = stdoutData.match(/\{.*\}/s);
                if (!jsonMatch) {
                    throw new Error("No JSON found in Python output");
                }
                const result = JSON.parse(jsonMatch[0]);
                if (result.error) return reject(new Error(result.error));
                resolve(result);
            } catch (parseError) {
                reject(new Error(`Failed to parse Python output: ${stdoutData}`));
            }
        });

        pythonProcess.stdin.write(JSON.stringify(data));
        pythonProcess.stdin.end();

        const timeout = setTimeout(() => {
            pythonProcess.kill();
            reject(new Error("Analysis timed out after 30 seconds"));
        }, 30000);

        pythonProcess.on('close', () => clearTimeout(timeout));
    });
}
/**
 * Shared Helper for Counting Corrections in History
 */
const countCorrectionsInHistory = (history) => {
    if (!Array.isArray(history)) return 0;
    // Count how many times the assistant messages contain "Correction:" or "[CORRECTED]"
    return history.filter(msg =>
        msg.role === 'assistant' &&
        (msg.content.includes('Correction:') || msg.content.includes('[CORRECTED]'))
    ).length;
};

/**
 * Phase 1: Socratic Tutor Chat (Text)
 */
const chatTutor = async (req, res, next) => {
    try {
        const { message, topic, history = [], conversationId } = req.body;
        const student = await Student.findOne({ userId: req.user._id });

        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        } else {
            conversation = new Conversation({
                studentId: student ? student._id : req.user._id,
                messages: [],
                title: topic || (message.substring(0, 30) + (message.length > 30 ? '...' : ''))
            });
        }

        // Add user message to local history for prompt
        let sanitizedHistory = [];
        if (Array.isArray(history)) sanitizedHistory = history;
        else if (typeof history === 'string') try { sanitizedHistory = JSON.parse(history); } catch (e) { }

        // --- STEP 2: Logic with Correction Limit ---
        const correctionCount = countCorrectionsInHistory(sanitizedHistory);
        const MAX_CORRECTIONS = 5;

        let correctionInstruction = "";
        if (correctionCount < MAX_CORRECTIONS) {
            correctionInstruction = `
LINGUISTIC CORRECTION RULE:
If the student makes any grammar, vocabulary, or spelling mistakes:
1. Provide a correction block at the very top of your response using this exact format:
   📝 Correction: [Provide the corrected sentence]
   💡 Explanation: [Briefly explain the mistake]
   ✅ Example: [Another correct example sentence]
2. Then, continue the conversation naturally in a new paragraph.
If NO mistakes, do NOT include the correction block.`;
        } else {
            correctionInstruction = `
Do NOT correct the student's grammar anymore. Focus on the conversation flow only. Ignore mistakes.`;
        }

        const systemPrompt = `You are a friendly and encouraging English language tutor on LexiLearn. 
Act naturally and conversationally, just like ChatGPT, but always stay in your role as a supportive tutor.
Maintain a teacher tone (clear and educational).
This is a TEXT interaction.
${correctionInstruction}`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...sanitizedHistory.slice(-10).map(m => ({
                role: m.role || 'user',
                content: m.content || m.text || ''
            })),
            { role: "user", content: message }
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
        });

        const aiResponse = completion.choices[0].message.content;

        // Persist messages to DB
        conversation.messages.push({ role: 'user', content: message });
        conversation.messages.push({ role: 'assistant', content: aiResponse });
        await conversation.save();

        return successResponse(res, 200, 'Tutor response generated', {
            response: aiResponse,
            conversationId: conversation._id,
            audioUrl: null
        });
    } catch (error) {
        console.error("Chat Tutor Error:", error);
        if (error.status === 429) {
            return res.status(429).json({ success: false, message: "AI service is busy." });
        }
        next(error);
    }
};

/**
 * Phase 1: Socratic Tutor Chat (Vocal)
 */
const chatTutorVocal = async (req, res, next) => {
    // res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // Not strictly needed if returning base64
    const filePath = req.file?.path;
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Audio stream was empty.' });
        }

        const { topic, history = "[]", conversationId } = req.body;
        const student = await Student.findOne({ userId: req.user._id });

        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        } else {
            conversation = new Conversation({
                studentId: student ? student._id : req.user._id,
                messages: [],
                title: topic || "Voice Scaffolding Session"
            });
        }

        let sanitizedHistory = [];
        try {
            sanitizedHistory = typeof history === 'string' ? JSON.parse(history) : history;
        } catch (e) { sanitizedHistory = []; }

        // --- STEP 1: Transcribe with Whisper ---
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-1",
            language: "en"
        });
        const transcribedText = transcription.text;

        // --- STEP 2: Logic with Correction Limit ---
        const correctionCount = countCorrectionsInHistory(sanitizedHistory);
        const MAX_CORRECTIONS = 5;

        let correctionInstruction = "";
        if (correctionCount < MAX_CORRECTIONS) {
            correctionInstruction = `
If the student makes any grammar, vocabulary, or pronunciation mistakes:
1. Start your response strictly with the tag "[CORRECTED] ".
2. Then, politely mention the correction and brief explanation (suitable for spoken conversion).
3. Then continue the conversation.
If NO mistakes, just respond naturally without the tag.`;
        } else {
            correctionInstruction = `
Do NOT correct the student's grammar anymore. Focus on the conversation flow only. Ignore mistakes.`;
        }

        const systemPrompt = `You are a friendly and encouraging English language tutor on LexiLearn. 
Act naturally and conversationally.
This is a VOICE interaction. Keep your response concise as it will be read aloud.
${correctionInstruction}`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...sanitizedHistory.slice(-10).map(m => ({
                role: m.role || 'user',
                content: m.content || m.text || ''
            })),
            { role: "user", content: transcribedText }
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
        });

        let aiResponse = completion.choices[0].message.content;

        // Check for correction and track in Conversation model if needed
        if (aiResponse.includes('[CORRECTED]')) {
            conversation.voiceCorrectionCount = (conversation.voiceCorrectionCount || 0) + 1;
        }

        // Remove the internal tag before TSS
        aiResponse = aiResponse.replace('[CORRECTED]', '').trim();

        // Persist messages to DB
        conversation.messages.push({ role: 'user', content: transcribedText });
        conversation.messages.push({ role: 'assistant', content: aiResponse });
        await conversation.save();

        // --- STEP 3: TTS ---
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: aiResponse,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        const base64Audio = buffer.toString('base64');
        const audioData = `data:audio/mpeg;base64,${base64Audio}`;

        // Save Base64 audio in the last assistant message
        if (conversation.messages.length > 0) {
            conversation.messages[conversation.messages.length - 1].audioBase64 = base64Audio;
            await conversation.save();
        }

        // Cleanup
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

        return successResponse(res, 200, 'Vocal response generated', {
            userText: transcribedText,
            response: aiResponse,
            conversationId: conversation._id,
            audioUrl: audioData // Base64
        });
    } catch (error) {
        console.error("❌ chatTutorVocal Error:", error);
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        next(error);
    }
};

/**
 * Phase 2 & 3: Independent Performance (Transcription) + Analysis Handover
 */
const transcribeAudio = async (req, res, next) => {
    // res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No audio file uploaded' });
        }

        const suggestedWords = req.body.suggestedWords ? JSON.parse(req.body.suggestedWords) : [];
        const filePath = req.file.path;

        if (!fs.existsSync(filePath)) {
            return res.status(500).json({ success: false, message: 'Source audio file lost' });
        }

        let studentText = "";
        try {
            console.log("--- 🎙️ OpenAI Whisper Transcription Started ---");
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: "whisper-1",
                language: "en"
            });
            studentText = transcription.text;
            console.log(`✅ Transcription Complete: "${studentText.substring(0, 50)}..."`);

        } catch (transcribeError) {
            console.error("❌ Whisper Transcription Error:", transcribeError);
            return res.status(500).json({
                success: false,
                message: "Transcription service encountered an error."
            });
        }

        // Automatic Handover to Python for Linguistic Analysis
        let metrics = null;
        if (studentText && studentText.trim().length > 0) {
            try {
                metrics = await executePythonBridge({
                    text: studentText,
                    suggested_words: suggestedWords
                });
                console.log('✅ Local Python Analysis complete');
            } catch (pyError) {
                console.error('⚠️ Local Python Analysis failed:', pyError.message);
            }
        }

        // Convert audio file to Base64
        const audioBuffer = fs.readFileSync(filePath);
        const audioBase64 = audioBuffer.toString('base64');
        const audioDataUrl = `data:audio/webm;base64,${audioBase64}`;

        // Cleanup uploaded file
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        return successResponse(res, 201, 'Transcription and analysis complete', {
            text: studentText,
            autoAnalysis: metrics,
            status: metrics?.status || "success",
            audioUrl: audioDataUrl // Return Base64 instead of file path
        });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        next(error);
    }
};

/**
 * Direct analysis endpoint
 */
const analyzeSpeech = async (req, res, next) => {
    try {
        const { transcription, suggestedWords = [] } = req.body;
        if (!transcription) return res.status(400).json({ success: false, message: 'No transcript provided' });

        const metrics = await executePythonBridge({
            text: transcription,
            suggested_words: suggestedWords
        });
        return successResponse(res, 200, 'Analysis complete', {
            analysis: metrics,
            status: metrics?.status || "success"
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Save Practice Session
 */
const saveSession = async (req, res, next) => {
    try {
        const { topic, transcript, metrics, audioUrl, conversationId } = req.body;

        const student = await Student.findOne({ userId: req.user._id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // --- Generate AI Feedback for Phase 2 ---
        let aiFeedback = "No evaluation generated.";
        try {
            const systemPrompt = `You are a Senior Linguistic Evaluator at LexiLearn.
Analyze the following transcript from a student's INDEPENDENT speech practice.
Generate a structured feedback report.

STRUCTURE:
1. Summary: A brief overview (2-3 sentences) of the student's speaking performance.
2. Grammar & Accuracy: Highlight specific patterns of mistakes the student made.
3. Lexical Range: Evaluate their vocabulary. Mention the variety and complexity.
4. Suggested Level: Suggest a CEFR level (A1-C2).

Format the output clearly with headers.`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Topic: ${topic}\nTranscript: ${transcript}` }
                ],
            });
            aiFeedback = completion.choices[0].message.content;
        } catch (aiErr) {
            console.error("AI Feedback Generation Error:", aiErr);
        }

        const session = new PracticeSession({
            studentId: student._id,
            topic: topic || 'General Practice',
            transcript: transcript,
            lexicalDiversity: metrics?.mtldScore || 0,
            sophistication: metrics?.lexicalSophistication || 0,
            density: metrics?.lexicalDensity || 0,
            masteryWords: metrics?.matches || [],
            audioBase64: audioUrl && audioUrl.startsWith('data:') ? audioUrl.split(',')[1] : null
        });

        await session.save();

        const submission = new SpeakingSubmission({
            studentId: student._id,
            topic: topic || 'General Practice Session',
            transcription: transcript,
            lexicalDiversity: metrics?.mtldScore || 0,
            lexicalDensity: metrics?.lexicalDensity || 0,
            lexicalSophistication: metrics?.lexicalSophistication || 0,
            advancedWords: metrics?.matches || [],
            audioBase64: audioUrl && audioUrl.startsWith('data:') ? audioUrl.split(',')[1] : null,
            highlightedTranscript: metrics?.highlightedTranscript || [],
            wordCount: metrics?.wordCount || 0,
            uniqueWordCount: metrics?.uniqueWordCount || 0,
            advice: aiFeedback, // Save generated feedback here
            conversationId: conversationId
        });
        await submission.save();

        return successResponse(res, 201, 'Session saved successfully', {
            session,
            aiFeedback
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Finalize Scaffolding Session: Generate structured AI evaluation
 * POST /lexilearn/finalize
 */
const finalizeScaffolding = async (req, res, next) => {
    try {
        const { conversationId, history = [] } = req.body;
        const student = await Student.findOne({ userId: req.user._id });

        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        } else {
            // Fallback for sessions not yet persisted correctly
            conversation = new Conversation({
                studentId: student ? student._id : req.user._id,
                messages: Array.isArray(history) ? history.map(m => ({
                    role: m.role,
                    content: m.content || m.text
                })) : []
            });
        }

        const messages = conversation.messages;
        if (messages.length === 0) {
            return res.status(400).json({ success: false, message: "No conversation history to analyze." });
        }

        const systemPrompt = `You are a Senior Linguistic Evaluator at LexiLearn.
Analyze the provided chat history between a student and an AI tutor.
Generate a structured feedback report in clear, encouraging, and professional language.

STRUCTURE:
1. Summary: A brief overview (2-3 sentences) of the student's performance and engagement.
2. Grammar & Accuracy: Highlight specific patterns of mistakes the student made and how they were corrected. (Note: Only 5 corrections were allowed per session).
3. Lexical Range: Evaluate their vocabulary. Did they use basic words, or did they successfully incorporate the 'Advanced' (Tier 2/3) words provided in their study bank? Provide examples.
4. Suggested Level: Suggest a CEFR level (A1, A2, B1, B2, C1, or C2) based on this interaction.

Format the output clearly with headers. Do NOT use markdown code blocks like \`\`\`json. Just plain structured text with headers.`;

        const messagesForAI = [
            { role: "system", content: systemPrompt },
            ...messages.slice(-20).map(m => ({ role: m.role, content: m.content }))
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messagesForAI,
        });

        const finalReport = completion.choices[0].message.content;

        // Save the final report to the conversation
        conversation.finalReport = finalReport;
        await conversation.save();

        return successResponse(res, 200, 'Final evaluation generated', {
            finalReport,
            conversationId: conversation._id
        });

    } catch (error) {
        console.error("❌ Finalize Scaffolding Error:", error);
        next(error);
    }
};

module.exports = {
    chatTutor,
    chatTutorVocal,
    transcribeAudio,
    analyzeSpeech,
    saveSession,
    finalizeScaffolding
};
