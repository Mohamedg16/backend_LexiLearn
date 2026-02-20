const axios = require('axios');
const fsExtra = require('fs-extra');
const SpeakingSubmission = require('../models/SpeakingSubmission');
const PracticeSession = require('../models/PracticeSession');
const Student = require('../models/Student');
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
        const { message, topic, history = [] } = req.body;

        let sanitizedHistory = [];
        if (Array.isArray(history)) sanitizedHistory = history;
        else if (typeof history === 'string') try { sanitizedHistory = JSON.parse(history); } catch (e) { }

        const systemPrompt = `You are a friendly and encouraging English language tutor on LexiLearn. 
Act naturally and conversationally, just like ChatGPT, but always stay in your role as a supportive tutor.

LINGUISTIC CORRECTION RULE:
If the student makes any grammar, vocabulary, or spelling mistakes:
1. Provide a correction block at the very top of your response using this exact format:
   📝 Correction: [Provide the corrected sentence]
   💡 Explanation: [Briefly explain the mistake]
   ✅ Example: [Another correct example sentence]
2. Then, continue the conversation naturally in a new paragraph.

IMPORTANT:
- If there are NO mistakes, do NOT include the correction block.
- Maintain a teacher tone (clear and educational).
- This is a TEXT interaction.`;

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

        return successResponse(res, 200, 'Tutor response generated', {
            response: aiResponse,
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

        const { topic, history = "[]" } = req.body;
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

        // Remove the internal tag before TSS
        aiResponse = aiResponse.replace('[CORRECTED]', '').trim();

        // --- STEP 3: TTS ---
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: aiResponse,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        const base64Audio = buffer.toString('base64');
        const audioData = `data:audio/mpeg;base64,${base64Audio}`;

        // Cleanup
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

        return successResponse(res, 200, 'Vocal response generated', {
            userText: transcribedText,
            response: aiResponse, // We still return text for the frontend to store in history, but frontend should hide it if needed
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

        return successResponse(res, 201, 'Transcription and analysis complete', {
            text: studentText,
            autoAnalysis: metrics,
            status: metrics?.status || "success",
            audioUrl: `/api/upload/file/${req.file.filename}` // Return original file path for playback
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
        const { topic, transcript, metrics, audioUrl } = req.body;

        const student = await Student.findOne({ userId: req.user._id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const session = new PracticeSession({
            studentId: student._id,
            topic: topic || 'General Practice',
            transcript: transcript,
            lexicalDiversity: metrics?.mtldScore || 0,
            sophistication: metrics?.lexicalSophistication || 0,
            density: metrics?.lexicalDensity || 0,
            masteryWords: metrics?.matches || [],
            audioUrl: audioUrl
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
            audioUrl: audioUrl,
            highlightedTranscript: metrics?.highlightedTranscript || [],
            wordCount: metrics?.wordCount || 0,
            uniqueWordCount: metrics?.uniqueWordCount || 0
        });
        await submission.save();

        return successResponse(res, 201, 'Session saved successfully', session);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    chatTutor,
    chatTutorVocal,
    transcribeAudio,
    analyzeSpeech,
    saveSession
};
