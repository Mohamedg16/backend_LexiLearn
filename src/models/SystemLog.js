const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    action: {
        type: String,
        required: true
    },
    method: {
        type: String,
        required: true
    },
    endpoint: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        required: true
    },
    ip: String,
    userAgent: String
}, {
    timestamps: true
});

module.exports = mongoose.model('SystemLog', systemLogSchema);
