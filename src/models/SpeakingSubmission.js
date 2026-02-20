const mongoose = require('mongoose');

const speakingSubmissionSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
        // required: false for general practice
    },
    topic: {
        type: String,
        default: 'General Practice Session'
    },
    audioUrl: {
        type: String
    },
    audioBase64: {
        type: String
    },
    transcription: {
        type: String,
        required: true
    },
    wordCount: {
        type: Number,
        default: 0
    },
    uniqueWordCount: {
        type: Number,
        default: 0
    },
    lexicalDiversity: {
        type: Number,
        default: 0 // e.g. TTR or MTLD
    },
    lexicalDensity: {
        type: Number,
        default: 0 // percentage of content words
    },
    lexicalSophistication: {
        type: Number,
        default: 0 // percentage of advanced words
    },
    advancedWords: [{
        type: String
    }],
    advice: {
        type: String
    },
    highlightedTranscript: [{
        word: String,
        type: {
            type: String,
            enum: ['tier3', 'academic', 'repetitive', 'standard', 'filler', 'normal', 'advanced'],
            default: 'standard'
        }
    }],
    duration: {
        type: Number,
        default: 0
    },
    planningTimeSpent: {
        type: Number,
        default: 0
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation'
    }
}, {
    timestamps: true
});

// Optimization Indexes
speakingSubmissionSchema.index({ studentId: 1 });
speakingSubmissionSchema.index({ taskId: 1 });
speakingSubmissionSchema.index({ studentId: 1, taskId: 1 });
speakingSubmissionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SpeakingSubmission', speakingSubmissionSchema);
