const mongoose = require('mongoose');

const aiInteractionLogSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },
    tool: {
        type: String,
        enum: ['vocab_coach', 'role_play'],
        required: true
    },
    requestType: {
        type: String, // synonym, check_sentence, question, etc.
        required: true
    },
    userMessage: {
        type: String,
        required: true
    },
    aiResponse: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AiInteractionLog', aiInteractionLogSchema);
