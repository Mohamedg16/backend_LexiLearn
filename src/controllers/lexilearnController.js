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

const Bytez = require('bytez.js');
const BYTEZ_API_KEY = process.env.BYTEZ_API_KEY;
// Initialize Bytez client
const bytezSdk = new Bytez(BYTEZ_API_KEY);
const bytezModel = bytezSdk.model("openai/gpt-4o");
// AssemblyAI Config
const ASSEMBLY_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLY_API_KEY_SCAFFOLDING = process.env.ASSEMBLYAI_API_KEY_SCAFFOLDING;
const ASSEMBLY_BASE_URL = "https://api.assemblyai.com/v2";

const assemblyHeaders = {
    authorization: ASSEMBLY_API_KEY,
    "content-type": "application/json"
};

const scaffoldingHeaders = {
    authorization: ASSEMBLY_API_KEY_SCAFFOLDING || ASSEMBLY_API_KEY
};

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
 * Shared Helper for Bytez AI Generation
 */
async function generateTutorResponse(messages) {
    const { error, output } = await bytezModel.run(messages);
    if (error) {
        console.error("Bytez API Error:", error);
        throw new Error("Bytez API returned an error");
    }

    let aiResponse = "";
    if (typeof output === 'string') aiResponse = output;
    else if (output?.content) aiResponse = output.content;
    else if (output?.choices?.[0]?.message) aiResponse = output.choices[0].message.content;
    else aiResponse = JSON.stringify(output);
    return aiResponse;
}

/**
 * Shared Logic for Friendly Tutor Processing
 */
const processTutorLogic = async (message, topic, history = [], isVocal = false) => {
    let sanitizedHistory = [];
    try {
        if (typeof history === 'string') {
            sanitizedHistory = JSON.parse(history);
        } else if (Array.isArray(history)) {
            sanitizedHistory = history;
        }
    } catch (e) {
        sanitizedHistory = [];
    }

    const systemPrompt = `You are a friendly and encouraging English language tutor on LexiLearn. 
Act naturally and conversationally, just like ChatGPT, but always stay in your role as a supportive tutor.

FREE TOPIC MODE:
You can discuss any topic the student wants. Be curious, engaging, and clear.

LINGUISTIC CORRECTION RULE:
If the student makes any grammar, vocabulary, or spelling mistakes:
1. Provide a correction block at the very top of your response using this exact format:
   You said: "[Quote the mistake]"
   Correct form: "[Provide the corrected version]"
   Explanation: "[Briefly explain the rule]"
   Example: "[Provide another correct example sentence]"
2. Then, continue the conversation naturally in a new paragraph.

IMPORTANT:
- If there are NO mistakes, do NOT include the correction block.
- Maintain a teacher tone (clear and educational).
- ${isVocal ? 'This is a VOICE interaction. Keep your response concise as it will be read aloud.' : 'This is a TEXT interaction.'}
- For VOICE input, if you notice pronunciation issues in the transcription, mention them naturally.
- Stay supportive and helpful!`;

    const messages = [
        { role: "system", content: systemPrompt },
        ...sanitizedHistory.slice(-10).map(m => ({
            role: m.role || 'user',
            content: m.content || m.text || ''
        })),
        { role: "user", content: message }
    ];

    return await generateTutorResponse(messages);
};

/**
 * TTS Helper using Bytez
 */
const synthesizeSpeech = async (text) => {
    try {
        // Cleaning text for better TTS (removing markdown icons/blocks)
        const cleanText = text.replace(/📝|💡|✅|---/g, '').trim();

        // Using a high-quality TTS model on Bytez
        const ttsModel = bytezSdk.model("elevenlabs/eleven_multilingual_v2");
        const { error, output } = await ttsModel.run(cleanText);

        if (error || !output) {
            console.error("Bytez TTS Error:", error || "Empty output");
            // Fallback to a faster OSS model
            const fallbackModel = bytezSdk.model("facebook/mms-tts-eng");
            const fallbackRes = await fallbackModel.run(cleanText);
            if (fallbackRes.error || !fallbackRes.output) return null;
            return await saveAudioBuffer(fallbackRes.output);
        }

        const audioUrl = await saveAudioBuffer(output);
        console.log("🔊 AI Audio Generated:", audioUrl);
        return audioUrl;
    } catch (err) {
        console.error("TTS Synthesis failed:", err);
        return null;
    }
};

/**
 * Save buffer to the uploads/audio directory
 */
const saveAudioBuffer = async (buffer) => {
    const fileName = `ai_res_${crypto.randomUUID()}.mp3`;
    const audioDir = path.join(__dirname, '../../uploads/audio');

    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }

    const filePath = path.join(audioDir, fileName);
    await fsExtra.writeFile(filePath, buffer);
    return `/uploads/audio/${fileName}`;
};

/**
 * Phase 1: Socratic Tutor Chat (Text)
 */
const chatTutor = async (req, res, next) => {
    try {
        const { message, topic, history = [] } = req.body;
        const aiResponse = await processTutorLogic(message, topic, history, false);

        return successResponse(res, 200, 'Tutor response generated', {
            response: aiResponse
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Phase 1: Socratic Tutor Chat (Vocal)
 */
const chatTutorVocal = async (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    const filePath = req.file?.path;
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Audio stream was empty.' });
        }

        const { topic, history = "[]" } = req.body;

        // --- STEP 1: Upload to AssemblyAI ---
        console.log("--- 🎙️ Uploading to AssemblyAI ---");
        const audioBuffer = fs.readFileSync(filePath);
        const uploadResponse = await axios.post(`${ASSEMBLY_BASE_URL}/upload`, audioBuffer, {
            headers: {
                ...scaffoldingHeaders,
                "content-type": "application/octet-stream"
            }
        });

        const uploadUrl = uploadResponse.data.upload_url;
        if (!uploadUrl) throw new Error("AssemblyAI upload failed - no URL returned.");

        // --- STEP 2: Create Transcription ---
        console.log("--- 📝 Creating Transcription ---");
        const transcriptReq = await axios.post(`${ASSEMBLY_BASE_URL}/transcript`, {
            audio_url: uploadUrl,
            language_code: "en",
            speech_models: ["universal-2"]
        }, {
            headers: {
                ...scaffoldingHeaders,
                "content-type": "application/json"
            }
        });

        const transcriptId = transcriptReq.data.id;
        let transcribedText = "";

        // --- STEP 3: Polling ---
        console.log(`--- ⏳ Polling Transcription: ${transcriptId} ---`);
        let pollingAttempts = 0;
        while (pollingAttempts < 30) {
            const pollingRes = await axios.get(`${ASSEMBLY_BASE_URL}/transcript/${transcriptId}`, {
                headers: scaffoldingHeaders
            });
            const { status, text, error: assemblyError } = pollingRes.data;

            if (status === "completed") {
                transcribedText = text;
                break;
            } else if (status === "error") {
                throw new Error(`AssemblyAI Error: ${assemblyError}`);
            }

            await new Promise(r => setTimeout(r, 1000));
            pollingAttempts++;
        }

        if (!transcribedText) {
            throw new Error("No speech detected. Please speak closer to the mic.");
        }

        console.log(`✅ Transcription Complete: "${transcribedText}"`);

        // 2. Process with AI Logic
        const aiResponse = await processTutorLogic(transcribedText, topic, history, true);

        // 3. Convert response to speech using Bytez
        let audioUrl = null;
        try {
            audioUrl = await synthesizeSpeech(aiResponse);
        } catch (ttsErr) {
            console.error("TTS conversion failed:", ttsErr);
        }

        // Cleanup temp file
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

        return successResponse(res, 200, 'Vocal response generated', {
            userText: transcribedText,
            response: aiResponse,
            audioUrl: audioUrl
        });
    } catch (error) {
        console.error("❌ chatTutorVocal Error:", error.response?.data || error.message);
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(500).json({
            success: false,
            message: error.message || "Voice processing failed."
        });
    }
};

/**
 * Phase 2 & 3: Independent Performance (Transcription) + Analysis Handover
 */
const transcribeAudio = async (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
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
            console.log("--- 🎙️ AssemblyAI Transcription Started ---");

            // 1. Upload to AssemblyAI
            const audioData = await fsExtra.readFile(filePath);
            const uploadResponse = await axios.post(`${ASSEMBLY_BASE_URL}/upload`, audioData, {
                headers: { ...assemblyHeaders, "content-type": "application/octet-stream" }
            });
            const assemblyAudioUrl = uploadResponse.data.upload_url;

            // 2. Request Transcript
            const transcriptReq = await axios.post(`${ASSEMBLY_BASE_URL}/transcript`, {
                audio_url: assemblyAudioUrl,
                language_code: "en",
                speech_models: ["universal-2"]
            }, { headers: assemblyHeaders });

            const transcriptId = transcriptReq.data.id;
            const pollingEndpoint = `${ASSEMBLY_BASE_URL}/transcript/${transcriptId}`;

            // 3. Polling
            console.log(`⏳ Transcription ${transcriptId} in progress...`);
            while (true) {
                const pollingResponse = await axios.get(pollingEndpoint, { headers: assemblyHeaders });
                const result = pollingResponse.data;

                if (result.status === "completed") {
                    studentText = result.text;
                    console.log("✅ AssemblyAI Transcription Complete");
                    break;
                } else if (result.status === "error") {
                    throw new Error(`AssemblyAI Error: ${result.error}`);
                } else {
                    await new Promise(r => setTimeout(r, 2000));
                }
            }

        } catch (transcribeError) {
            console.error("❌ AssemblyAI Engine Error:", transcribeError.message);
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
            audioUrl: `/api/upload/file/${req.file.filename}`
        });

    } catch (error) {
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
