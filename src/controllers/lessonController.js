const Lesson = require('../models/Lesson');
const { successResponse } = require('../utils/helpers');

/**
 * Get lesson by ID
 * GET /api/lessons/:id
 */
const getLessonById = async (req, res, next) => {
    try {
        const lesson = await Lesson.findById(req.params.id)
            .populate('moduleId', 'title')
            .populate('resources');

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        return successResponse(res, 200, 'Lesson retrieved', lesson);
    } catch (error) {
        next(error);
    }
};

/**
 * Get lesson resources
 * GET /api/lessons/:id/resources
 */
const getLessonResources = async (req, res, next) => {
    try {
        const Resource = require('../models/Resource');
        const resources = await Resource.find({ lessonId: req.params.id });

        return successResponse(res, 200, 'Resources retrieved', resources);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLessonById,
    getLessonResources
};

/**
 * Create a new lesson
 * POST /api/lessons
 */
const createLesson = async (req, res, next) => {
    try {
        const { moduleId, title, description, content, duration, videoUrl, thumbnailUrl, isPublished } = req.body;

        // Auto-calculate order if not provided
        let order = req.body.order;
        if (!order) {
            const lastLesson = await Lesson.findOne({ moduleId }).sort({ order: -1 });
            order = lastLesson ? lastLesson.order + 1 : 1;
        }

        const lesson = await Lesson.create({
            moduleId,
            title,
            description,
            content,
            order,
            duration,
            videoUrl,
            thumbnailUrl,
            isPublished
        });

        return successResponse(res, 201, 'Lesson created successfully', lesson);
    } catch (error) {
        next(error);
    }
};

/**
 * Update lesson
 * PUT /api/lessons/:id
 */
const updateLesson = async (req, res, next) => {
    try {
        const { title, description, content, order, duration, videoUrl, thumbnailUrl, isPublished } = req.body;

        const lesson = await Lesson.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description,
                content,
                order,
                duration,
                videoUrl,
                thumbnailUrl,
                isPublished
            },
            { new: true, runValidators: true }
        );

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        return successResponse(res, 200, 'Lesson updated successfully', lesson);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete lesson
 * DELETE /api/lessons/:id
 */
const deleteLesson = async (req, res, next) => {
    try {
        const lesson = await Lesson.findById(req.params.id);

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        // TODO: Delete associated resources if needed?
        // For now, just delete the lesson
        await lesson.deleteOne();

        return successResponse(res, 200, 'Lesson deleted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get all lessons
 * GET /api/lessons
 */
const getAllLessons = async (req, res, next) => {
    try {
        const lessons = await Lesson.find()
            .populate('moduleId', 'title')
            .populate('resources')
            .sort({ createdAt: -1 });

        return successResponse(res, 200, 'Lessons retrieved', lessons);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLessonById,
    getLessonResources,
    createLesson,
    updateLesson,
    deleteLesson,
    getAllLessons
};
