const Video = require('../models/Video');
const { successResponse, createPagination } = require('../utils/helpers');

/**
 * Get all videos with filters
 * GET /api/videos
 */
const getAllVideos = async (req, res, next) => {
    try {
        const { category, search, page = 1, limit = 20 } = req.query;

        const filters = {};

        if (category) filters.category = category;
        if (search) {
            filters.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const videos = await Video.find(filters)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Video.countDocuments(filters);
        const pagination = createPagination(page, limit, total);

        return successResponse(res, 200, 'Videos retrieved', videos, pagination);
    } catch (error) {
        next(error);
    }
};

/**
 * Get video by ID
 * GET /api/videos/:id
 */
const getVideoById = async (req, res, next) => {
    try {
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        // Increment view count
        video.views += 1;
        await video.save();

        return successResponse(res, 200, 'Video retrieved', video);
    } catch (error) {
        next(error);
    }
};

/**
 * Get videos by category
 * GET /api/videos/category/:category
 */
const getVideosByCategory = async (req, res, next) => {
    try {
        const videos = await Video.find({ category: req.params.category })
            .sort({ createdAt: -1 });

        return successResponse(res, 200, 'Videos retrieved', videos);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllVideos,
    getVideoById,
    getVideosByCategory
};
