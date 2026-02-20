const Conversation = require('../models/Conversation');
const Student = require('../models/Student');
const SpeakingSubmission = require('../models/SpeakingSubmission');
const { successResponse } = require('../utils/helpers');
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Handle standard text message
 * Text -> Text
 */
const sendMessage = async (req, res, next) => {
    try {
        const { message, conversationId } = req.body;
        const student = await Student.findOne({ userId: req.user._id });

        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        } else {
            conversation = new Conversation({
                studentId: student ? student._id : req.user._id, // Fallback if user is student directly
                messages: [],
                title: message.substring(0, 30) + (message.length > 30 ? '...' : '')
            });
        }

        // Add user message to history
        conversation.messages.push({ role: 'user', content: message });

        // System Prompt for Text Mode
        const systemPrompt = `You are a friendly and encouraging language tutor on LexiLearn.
Act naturally and conversationally, just like ChatGPT, but always stay in your role as a supportive tutor.

GRAMMAR CORRECTION RULE:
If the student makes any grammar, vocabulary, or spelling mistakes:
1. Provide a correction block at the very top of your response:
   📝 Correction: [Provide the corrected sentence]
   💡 Explanation: [Briefly explain the mistake]
   ✅ Example: [Another correct example sentence]
2. Then, continue the conversation naturally in a new paragraph.

IMPORTANT: If there are NO mistakes, do NOT include the correction block. Just respond naturally.`;

        const messagesForAI = [
            { role: "system", content: systemPrompt },
            ...conversation.messages.map(msg => ({ role: msg.role, content: msg.content }))
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messagesForAI,
        });

        const aiResponse = completion.choices[0].message.content;

        conversation.messages.push({ role: 'assistant', content: aiResponse });
        await conversation.save();

        return successResponse(res, 200, 'Message processed', {
            conversationId: conversation._id,
            response: aiResponse,
            userText: message
        });

    } catch (error) {
        console.error("AI Text Chat Error:", error);
        if (error.status === 429) {
            return res.status(429).json({ success: false, message: "AI service is busy." });
        }
        next(error);
    }
};

/**
 * Handle vocal/audio message
 * Voice -> Voice (Audio only response)
 */
const sendVocalMessage = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No audio recorded' });

        const { conversationId } = req.body;
        const student = await Student.findOne({ userId: req.user._id });

        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        } else {
            conversation = new Conversation({
                studentId: student ? student._id : req.user._id,
                messages: []
            });
        }

        // 1. Transcribe (Whisper)
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(req.file.path),
            model: "whisper-1",
            language: "en"
        });
        const userText = transcription.text;

        if (conversation.messages.length === 0) {
            conversation.title = userText.substring(0, 30);
        }
        conversation.messages.push({ role: 'user', content: userText });

        // 2. Chat Logic with Correction Limit (Max 5)
        const MAX_CORRECTIONS = 5;
        const currentCount = conversation.voiceCorrectionCount || 0;
        let correctionPrompt = "";

        if (currentCount < MAX_CORRECTIONS) {
            correctionPrompt = `
GRAMMAR CORRECTION RULE:
If the student makes any grammar/vocabulary mistakes:
1. Start your response strictly with the tag "[CORRECTED] ".
2. Then, politely mention the correction and explanation briefly (suitable for spoken conversion).
3. Then continue the conversation.
If NO mistakes, just respond naturally without the tag.`;
        } else {
            correctionPrompt = `
Do NOT correct the student's grammar anymore. Focus on the conversation flow only. Ignore mistakes.`;
        }

        const systemPrompt = `You are a friendly language tutor on LexiLearn talking via voice.
Keep your responses concise and conversational (suitable for audio).
${correctionPrompt}`;

        const messagesForAI = [
            { role: "system", content: systemPrompt },
            ...conversation.messages.map(msg => ({ role: msg.role, content: msg.content }))
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messagesForAI,
        });

        let aiResponse = completion.choices[0].message.content;
        let incremented = false;

        // Check if correction happened
        if (aiResponse.includes('[CORRECTED]')) {
            if (currentCount < MAX_CORRECTIONS) {
                conversation.voiceCorrectionCount = currentCount + 1;
                incremented = true;
            }
            aiResponse = aiResponse.replace('[CORRECTED]', '').trim();
        }

        conversation.messages.push({ role: 'assistant', content: aiResponse });
        await conversation.save();

        // 3. TTS (Text to Speech)
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: aiResponse,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        const base64Audio = buffer.toString('base64');
        const audioData = `data:audio/mpeg;base64,${base64Audio}`;

        // Cleanup
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        return successResponse(res, 200, 'Vocal processed', {
            conversationId: conversation._id,
            // Do NOT return text in this case (as per requirement), 
            // but returning userText helps frontend show what was heard.
            userText: userText,
            audioBase64: audioData,
            // We do not return `response` text field for display, strictly adhering to "Do NOT return text" for the AI part.
            voiceCorrectionCount: conversation.voiceCorrectionCount
        });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error("AI Voice Chat Error:", error);
        next(error);
    }
};

/**
 * Get all conversations
 */
const getConversations = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

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
        if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
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
        if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
        return successResponse(res, 200, 'Conversation deleted', null);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all student conversations (Teacher/Admin)
 */
const getAllStudentConversations = async (req, res, next) => {
    try {
        const [conversations, submissions] = await Promise.all([
            Conversation.find().populate({
                path: 'studentId',
                select: 'userId',
                populate: { path: 'userId', select: 'name email fullName' }
            }).lean(),
            SpeakingSubmission.find().populate({
                path: 'studentId',
                select: 'userId',
                populate: { path: 'userId', select: 'name email fullName' }
            }).lean()
        ]);

        const chatLogs = conversations.map(c => ({
            _id: c._id,
            type: 'chat',
            student: c.studentId,
            title: c.title || 'General Chat',
            preview: c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1].content : '',
            messageCount: c.messages ? c.messages.length : 0,
            date: c.updatedAt,
            details: c
        }));

        const voiceLogs = submissions.map(s => ({
            _id: s._id,
            type: 'voice',
            student: s.studentId,
            title: s.topic || 'Speaking Practice',
            preview: s.transcription ? s.transcription.substring(0, 50) + '...' : 'Audio Submission',
            messageCount: 1,
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
