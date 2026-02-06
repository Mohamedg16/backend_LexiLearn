const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Module title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    thumbnail: {
        type: String,
        default: null
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    level: {
        type: String,
        enum: ['A1 Beginner', 'A2 Elementary', 'B1 Intermediate', 'B2 Upper Inter', 'C1 Advanced', 'C2 Mastery'],
        required: true
    },
    assignedTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        default: null
    },
    lessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
    }],
    totalDuration: {
        type: Number,
        default: 0,
        min: 0
    },
    enrolledStudentsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [String],
    difficulty: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    }
}, {
    timestamps: true
});

// Indexes
moduleSchema.index({ category: 1 });
moduleSchema.index({ level: 1 });
moduleSchema.index({ isPublished: 1 });
moduleSchema.index({ tags: 1 });

const Module = mongoose.model('Module', moduleSchema);

module.exports = Module;
