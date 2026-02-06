const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    prompt: {
        type: String,
        required: true
    },
    timeLimit: {
        type: Number, // in seconds
        required: true,
        default: 120
    },
    planningTimeLimit: {
        type: Number, // in seconds
        default: 300 // 5 minutes
    },
    targetVocabulary: [{
        type: String
    }],
    timePoint: {
        type: String,
        enum: ['pretest', 'week1', 'week2', 'week3', 'week4', 'week5', 'week6', 'week7', 'week8', 'posttest'],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
