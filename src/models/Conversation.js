const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student ID is required']
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true
        },
        content: {
            type: String,
            required: true,
            maxlength: [10000, 'Message content cannot exceed 10000 characters']
        },
        audioBase64: {
            type: String,
            default: null
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    title: {
        type: String,
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    voiceCorrectionCount: {
        type: Number,
        default: 0
    },
    finalReport: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Indexes
conversationSchema.index({ studentId: 1 });
conversationSchema.index({ createdAt: -1 });

// Auto-generate title from first message if not provided
conversationSchema.pre('save', function (next) {
    if (!this.title && this.messages.length > 0) {
        const firstMessage = this.messages[0].content;
        this.title = firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
    }
    next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
