const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student ID is required']
    },
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: [true, 'Module ID is required']
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'dropped'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Compound unique index to prevent duplicate enrollments
enrollmentSchema.index({ studentId: 1, moduleId: 1 }, { unique: true });
enrollmentSchema.index({ studentId: 1 });
enrollmentSchema.index({ moduleId: 1 });
enrollmentSchema.index({ status: 1 });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = Enrollment;
