const Conversation = require('../models/Conversation');
const Student = require('../models/Student');
const { successResponse } = require('../utils/helpers');

/**
 * Send message to AI
 */
const axios = require('axios');
const fsExtra = require('fs-extra');
const fs = require('fs');
const Bytez = require('bytez.js');
const BYTEZ_API_KEY = process.env.BYTEZ_API_KEY;
// Initialize Bytez client
const bytezSdk = new Bytez(BYTEZ_API_KEY);
const bytezModel = bytezSdk.model("openai/gpt-4o");

// AssemblyAI Config
const ASSEMBLY_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLY_BASE_URL = "https://api.assemblyai.com/v2";

const assemblyHeaders = {
    authorization: ASSEMBLY_API_KEY,
    "content-type": "application/json"
};

/**
 * Helper to transcribe audio using AssemblyAI
 */
const transcribeAudio = async (filePath) => {
    try {
        // 1. Upload to AssemblyAI
        const audioData = await fsExtra.readFile(filePath);
        const uploadResponse = await axios.post(`${ASSEMBLY_BASE_URL}/upload`, audioData, {
            headers: { ...assemblyHeaders, "content-type": "application/octet-stream" }
        });
        const assemblyAudioUrl = uploadResponse.data.upload_url;

        // 2. Request Transcript
        const transcriptReq = await axios.post(`${ASSEMBLY_BASE_URL}/transcript`, {
            audio_url: assemblyAudioUrl,
            language_code: "en"
        }, { headers: assemblyHeaders });

        const transcriptId = transcriptReq.data.id;
        const pollingEndpoint = `${ASSEMBLY_BASE_URL}/transcript/${transcriptId}`;

        // 3. Polling
        while (true) {
            const pollingResponse = await axios.get(pollingEndpoint, { headers: assemblyHeaders });
            const result = pollingResponse.data;

            if (result.status === "completed") {
                return result.text;
            } else if (result.status === "error") {
                throw new Error(`AssemblyAI Error: ${result.error}`);
            } else {
                await new Promise(r => setTimeout(r, 1500));
            }
        }
    } catch (error) {
        console.error("Transcription Error:", error.message);
        throw error;
    }
};

/**
 * Main AI Message Logic (Shared for Text and Vocal)
 */
const processAiResponse = async (userText, conversationId, userId) => {
    const student = await Student.findOne({ userId });
    if (!student) throw new Error('Student profile not found');

    let conversation;
    if (conversationId) {
        conversation = await Conversation.findById(conversationId);
        if (!conversation) throw new Error('Conversation lost');
    } else {
        conversation = new Conversation({
            studentId: student._id,
            messages: [],
            title: userText.substring(0, 30) + (userText.length > 30 ? '...' : '')
        });
    }

    conversation.messages.push({ role: 'user', content: userText });

    const messagesForAI = [
        {
            role: "system",
            content: `You are an 'Empathetic Language Tutor' for students on LexiLearn. Your goal is to support their learning journey with a supportive, educational, and peer-like tone.

For EVERY student message:
1. First, analyze the message for any linguistic or grammatical errors.
2. If there ARE errors, start your response with a 'Correction' block exactly like this:
   ---
   📝 Correction: [Briefly explain the error and provide the corrected version]
   ---
3. Then, proceed with your natural, empathetic response to their message content.

If there are NO errors, do NOT include the correction block and just respond naturally. Be encouraging and helpful.`
        },
        ...conversation.messages.map(msg => ({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content }))
    ];

    const { error, output } = await bytezModel.run(messagesForAI);
    if (error) throw new Error("AI Service failure");

    let aiResponse = "";
    if (typeof output === 'string') aiResponse = output;
    else if (output?.content) aiResponse = output.content;
    else if (output?.choices?.[0]?.message) aiResponse = output.choices[0].message.content;
    else aiResponse = JSON.stringify(output);

    conversation.messages.push({ role: 'assistant', content: aiResponse });
    await conversation.save();

    return {
        conversationId: conversation._id,
        response: aiResponse,
        userText: userText, // Return what was understood (especially for vocales)
        messages: conversation.messages
    };
};

/**
 * Handle standard text message
 */
const sendMessage = async (req, res, next) => {
    try {
        const { message, conversationId } = req.body;
        const result = await processAiResponse(message, conversationId, req.user._id);
        return successResponse(res, 200, 'Message processed', result);
    } catch (error) {
        console.error("AI Error:", error.response ? error.response.data : error.message);
        // Fallback or error handling
        if (error.response && error.response.status === 429) {
            return res.status(429).json({ success: false, message: "AI service is currently busy. Please try again later." });
        }
        next(error);
    }
};

/**
 * Handle vocal/audio message (using AssemblyAI)
 */
const sendVocalMessage = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No audio recorded' });
        const { conversationId } = req.body;

        // 1. Transcribe with AssemblyAI
        const transcribedText = await transcribeAudio(req.file.path);

        // 2. Process with AI Tutor
        const result = await processAiResponse(transcribedText, conversationId, req.user._id);

        // Clean up temp file
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        return successResponse(res, 200, 'Vocal processed', result);
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error("Vocal Message Error:", error.message);
        // Fallback or error handling
        if (error.response && error.response.status === 429) {
            return res.status(429).json({ success: false, message: "AI service is currently busy. Please try again later." });
        }
        next(error);
    }
};
/**
 * Get all conversations
 */
const getConversations = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        const conversations = await Conversation.find({ studentId: student._id })
            .select('title createdAt updatedAt')
            .sort({ updatedAt: -1 });

        return successResponse(res, 200, 'Conversations retrieved', conversations);
    } catch (error) {
        next(error);
    }
};

/**
 * Get conversation by ID
 */
const getConversationById = async (req, res, next) => {
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        return successResponse(res, 200, 'Conversation retrieved', conversation);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete conversation
 */
const deleteConversation = async (req, res, next) => {
    try {
        const conversation = await Conversation.findByIdAndDelete(req.params.id);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        return successResponse(res, 200, 'Conversation deleted', null);
    } catch (error) {
        next(error);
    }
};

const SpeakingSubmission = require('../models/SpeakingSubmission');

/**
 * Get all conversations for all students (Teacher/Admin only)
 * Merges Text Chat (Conversation) and Voice/Speech (SpeakingSubmission)
 */
const getAllStudentConversations = async (req, res, next) => {
    try {
        const [conversations, submissions] = await Promise.all([
            Conversation.find()
                .populate({
                    path: 'studentId',
                    select: 'userId',
                    populate: { path: 'userId', select: 'name email fullName' } // Support both name/fullName fields depending on schema
                })
                .lean(),
            SpeakingSubmission.find()
                .populate({
                    path: 'studentId',
                    select: 'userId',
                    populate: { path: 'userId', select: 'name email fullName' }
                })
                .lean()
        ]);

        // Normalize Data for Unified View
        const chatLogs = conversations.map(c => ({
            _id: c._id,
            type: 'chat',
            student: c.studentId,
            title: c.title || 'General Chat',
            preview: c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1].content : '',
            messageCount: c.messages ? c.messages.length : 0,
            date: c.updatedAt,
            details: c // Keep full object for modal
        }));

        const voiceLogs = submissions.map(s => ({
            _id: s._id,
            type: 'voice',
            student: s.studentId,
            title: s.topic || 'Speaking Practice',
            preview: s.transcription ? s.transcription.substring(0, 50) + '...' : 'Audio Submission',
            messageCount: 1, // Considered as 1 interaction session
            date: s.createdAt,
            details: s
        }));

        const combinedLogs = [...chatLogs, ...voiceLogs].sort((a, b) => new Date(b.date) - new Date(a.date));

        return successResponse(res, 200, 'All student AI interactions retrieved', combinedLogs);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    sendMessage,
    sendVocalMessage,
    getConversations,
    getConversationById,
    deleteConversation,
    getAllStudentConversations
};
