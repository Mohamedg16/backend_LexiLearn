const axios = require('axios');
const fsExtra = require('fs-extra');
const SpeakingSubmission = require('../models/SpeakingSubmission');
const PracticeSession = require('../models/PracticeSession');
const Student = require('../models/Student');
const { successResponse } = require('../utils/helpers');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const Bytez = require('bytez.js');
const BYTEZ_API_KEY = process.env.BYTEZ_API_KEY;
// Initialize Bytez client
const bytezSdk = new Bytez(BYTEZ_API_KEY);
const bytezModel = bytezSdk.model("openai/gpt-4o");
// AssemblyAI Config
const ASSEMBLY_API_KEY = process.env.ASSEMBLYAI_API_KEY || "bab74404f4c349909532f5763de74834";
const ASSEMBLY_BASE_URL = "https://api.assemblyai.com/v2";

const assemblyHeaders = {
    authorization: ASSEMBLY_API_KEY,
    "content-type": "application/json"
};

/**
 * Helper to spawn Python process and communicate via stdin/stdout
 */
function executePythonBridge(data) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../utils/lexical_analysis/wrapper.py');
        const pythonProcess = spawn('python', [scriptPath]);

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
 * Phase 1: Socratic Tutor Chat
 */
const chatTutor = async (req, res, next) => {
    try {
        const { message, topic } = req.body;

        const messages = [
            { role: "system", content: `You are a Socratic Tutor helping a student brainstorm for a speaking task on the topic: "${topic}". Your goal is to help them organize their thoughts and use advanced vocabulary. Do not write the speech for them. Ask guiding questions. Be concise.` },
            { role: "user", content: message }
        ];

        // Bytez (OpenAI Compatible) format
        const prompt = [
            { role: "system", content: "You are a helpful and knowledgeable academic assistant for students using LexiLearn. Your goal is to help them with their studies, vocabulary, and language skills. Be encouraging, precise, and concise." },
            { role: "user", content: `System: You are a Socratic Tutor helping a student brainstorm for a speaking task on the topic: "${topic}". Your goal is to help them organize their thoughts and use advanced vocabulary. Do not write the speech for them. Ask guiding questions. Be concise.\nUser: ${message}` }
        ];

        const { error, output } = await bytezModel.run(prompt);

        if (error) {
            console.error("Bytez API Error:", error);
            throw new Error("Bytez API returned an error");
        }

        let aiResponse = "";
        if (typeof output === 'string') {
            aiResponse = output;
        } else if (output && output.content) {
            aiResponse = output.content;
        } else if (output && output.choices && output.choices[0] && output.choices[0].message) {
            aiResponse = output.choices[0].message.content; // OpenAI format fallback
        } else {
            console.warn("Unexpected Bytez output:", output);
            aiResponse = JSON.stringify(output); // Safety net
        }
        return successResponse(res, 200, 'Tutor response generated', {
            response: aiResponse
        });
    } catch (error) {
        console.error("AI Tutor Error:", error);
        next(error);
    }
};

/**
 * Phase 2 & 3: Independent Performance (Transcription) + Analysis Handover
 */
const transcribeAudio = async (req, res, next) => {
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
                speech_models: ["universal-3-pro", "universal-2"]
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
    transcribeAudio,
    analyzeSpeech,
    saveSession
};
