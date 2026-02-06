const Conversation = require('../models/Conversation');
const Student = require('../models/Student');
const { successResponse } = require('../utils/helpers');

/**
 * Send message to AI
 */
const axios = require('axios');
const Bytez = require('bytez.js');
const BYTEZ_API_KEY = process.env.BYTEZ_API_KEY;
// Initialize Bytez client
const bytezSdk = new Bytez(BYTEZ_API_KEY);
const bytezModel = bytezSdk.model("openai/gpt-4o");
/**
 * Send message to AI
 */
const sendMessage = async (req, res, next) => {
    try {
        const { message, conversationId } = req.body;

        const student = await Student.findOne({ userId: req.user._id });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
            if (!conversation) return res.status(404).json({ success: false, message: 'Conversation lost' });
        } else {
            conversation = new Conversation({
                studentId: student._id,
                messages: [],
                title: message.substring(0, 30) + (message.length > 30 ? '...' : '')
            });
        }

        // Add user message
        conversation.messages.push({ role: 'user', content: message });

        // Prepare messages for Bytez (OpenAI Compatible format)
        const messagesForAI = [
            { role: "system", content: "You are a helpful and knowledgeable academic assistant for students using LexiLearn. Your goal is to help them with their studies, vocabulary, and language skills. Be encouraging, precise, and concise." },
            ...conversation.messages.map(msg => ({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content }))
        ];

        // Call Bytez API
        const { error, output } = await bytezModel.run(messagesForAI);

        if (error) {
            console.error("Bytez API Error:", error);
            throw new Error("Bytez API returned an error");
        }

        // Bytez output structure is typically string or object depending on model but usually 'output' contains the response text
        // Need to verify if output is a string or structured like OpenAI choices.
        // Assuming output is the direct response string based on user snippet provided. 
        // User snippet showed: console.log({ error, output });
        // Let's assume output is the string content.

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
        // Add AI response
        conversation.messages.push({
            role: 'assistant',
            content: aiResponse
        });

        await conversation.save();

        return successResponse(res, 200, 'Message processed', {
            conversationId: conversation._id,
            response: aiResponse,
            messages: conversation.messages
        });
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
    getConversations,
    getConversationById,
    deleteConversation,
    getAllStudentConversations
};
