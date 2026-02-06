const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    assignedModules: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module'
    }],
    totalTeachingHours: {
        type: Number,
        default: 0,
        min: 0
    },
    hourlyRate: {
        type: Number,
        required: true,
        min: 0,
        default: 25
    },
    totalEarnings: {
        type: Number,
        default: 0,
        min: 0
    },
    pendingPayment: {
        type: Number,
        default: 0,
        min: 0
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    paymentHistory: [{
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        paidAt: {
            type: Date,
            default: Date.now
        },
        paymentMethod: {
            type: String,
            enum: ['bank_transfer', 'paypal', 'check', 'cash', 'other'],
            default: 'bank_transfer'
        },
        status: {
            type: String,
            enum: ['paid', 'pending', 'overdue', 'cancelled'],
            default: 'paid'
        },
        notes: String,
        transactionId: String
    }],
    bio: {
        type: String,
        maxlength: 500
    },
    yearsOfExperience: {
        type: Number,
        min: 0,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes
teacherSchema.index({ 'paymentHistory.status': 1 });

// Method to calculate total owed
teacherSchema.methods.calculateTotalOwed = function () {
    return this.totalTeachingHours * this.hourlyRate;
};

// Method to calculate pending payment
teacherSchema.methods.updatePendingPayment = function () {
    const totalOwed = this.calculateTotalOwed();
    this.pendingPayment = totalOwed - this.totalEarnings;
    return this.pendingPayment;
};

// Method to add payment
teacherSchema.methods.addPayment = function (amount, paymentMethod, notes = '') {
    this.paymentHistory.push({
        amount,
        paymentMethod,
        status: 'paid',
        notes,
        paidAt: new Date()
    });

    this.totalEarnings += amount;
    this.updatePendingPayment();
};

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;
