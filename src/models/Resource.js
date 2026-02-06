const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        default: null
    },
    title: {
        type: String,
        required: [true, 'Resource title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
        type: String,
        trim: true,
        default: 'General'
    },
    type: {
        type: String,
        enum: ['pdf', 'document', 'link', 'image'],
        required: [true, 'Resource type is required']
    },
    url: {
        type: String,
        required: [true, 'Resource URL is required'],
        trim: true
    },
    fileSize: {
        type: Number,
        default: null,
        min: [0, 'File size cannot be negative']
    },
    downloadCount: {
        type: Number,
        default: 0,
        min: [0, 'Download count cannot be negative']
    }
}, {
    timestamps: true
});

// Indexes
resourceSchema.index({ lessonId: 1 });
resourceSchema.index({ type: 1 });

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
