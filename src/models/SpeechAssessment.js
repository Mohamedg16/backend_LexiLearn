const mongoose = require('mongoose');

const speechAssessmentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
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
        default: 0
    },
    advancedWords: [{
        type: String
    }],
    advancedWordsCount: {
        type: Number,
        default: 0
    },
    lexicalSophistication: {
        type: Number,
        default: 0
    },
    lexicalDensity: {
        type: Number,
        default: 0
    },
    mtldScore: {
        type: Number,
        default: 0
    },
    advice: {
        type: String
    },
    duration: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SpeechAssessment', speechAssessmentSchema);
