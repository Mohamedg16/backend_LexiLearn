const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module'
    },
    title: {
        type: String,
        required: [true, 'Lesson title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    content: {
        type: String,
        maxlength: [50000, 'Content cannot exceed 50000 characters']
    },
    order: {
        type: Number,
        default: 1,
        min: [1, 'Order must be at least 1']
    },
    duration: {
        type: Number,
        default: 0,
        min: [0, 'Duration cannot be negative']
    },
    resources: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource'
    }],
    videoUrl: {
        type: String,
        default: null,
        trim: true
    },
    thumbnailUrl: {
        type: String,
        default: null,
        trim: true
    },
    isPublished: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
lessonSchema.index({ moduleId: 1 });
lessonSchema.index({ order: 1 });
lessonSchema.index({ isPublished: 1 });
lessonSchema.index({ moduleId: 1, order: 1 });

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = Lesson;
