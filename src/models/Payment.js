const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    userRole: {
        type: String,
        enum: ['student', 'teacher'],
        required: [true, 'User role is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    type: {
        type: String,
        enum: ['subscription', 'teacher_payment'],
        required: [true, 'Payment type is required']
    },
    status: {
        type: String,
        enum: ['paid', 'pending', 'overdue', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        trim: true
    },
    dueDate: {
        type: Date
    },
    paidAt: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

// Indexes
paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ dueDate: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
