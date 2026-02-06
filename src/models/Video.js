const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Video title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    youtubeUrl: {
        type: String,
        required: [true, 'YouTube URL is required'],
        trim: true
    },
    thumbnail: {
        type: String,
        default: null,
        trim: true
    },
    duration: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    views: {
        type: Number,
        default: 0,
        min: [0, 'Views cannot be negative']
    }
}, {
    timestamps: true
});

// Indexes
videoSchema.index({ category: 1 });
videoSchema.index({ tags: 1 });
videoSchema.index({ createdAt: -1 });

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
