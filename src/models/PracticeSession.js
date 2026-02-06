const mongoose = require('mongoose');

const practiceSessionSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    transcript: {
        type: String,
        required: true
    },
    lexicalDiversity: {
        type: Number,
        default: 0
    },
    sophistication: {
        type: Number,
        default: 0
    },
    density: {
        type: Number,
        default: 0
    },
    masteryWords: [{
        type: String
    }],
    audioUrl: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PracticeSession', practiceSessionSchema);
