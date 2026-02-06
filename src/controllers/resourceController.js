const Resource = require('../models/Resource');
const { successResponse } = require('../utils/helpers');

/**
 * Get all resources
 * GET /api/resources
 */
const getAllResources = async (req, res, next) => {
    try {
        const { category, type } = req.query;
        const filters = {};
        if (category) filters.category = category;
        if (type) filters.type = type;

        const resources = await Resource.find(filters).populate('lessonId', 'title');
        return successResponse(res, 200, 'Resources retrieved', resources);
    } catch (error) {
        next(error);
    }
};

/**
 * Get resource by ID
 * GET /api/resources/:id
 */
const getResourceById = async (req, res, next) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        // Increment download count
        resource.downloadCount += 1;
        await resource.save();

        return successResponse(res, 200, 'Resource retrieved', resource);
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new resource
 * POST /api/resources
 */
const createResource = async (req, res, next) => {
    try {
        const { lessonId, title, type, url, fileSize, description, category } = req.body;
        const Lesson = require('../models/Lesson');

        const resource = await Resource.create({
            lessonId: lessonId || null,
            title,
            type,
            url,
            fileSize,
            description,
            category
        });

        // Add resource to lesson if provided
        if (lessonId) {
            await Lesson.findByIdAndUpdate(lessonId, {
                $push: { resources: resource._id }
            });
        }

        return successResponse(res, 201, 'Resource created successfully', resource);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete resource
 * DELETE /api/resources/:id
 */
const deleteResource = async (req, res, next) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        // Remove from lesson if it was linked
        if (resource.lessonId) {
            const Lesson = require('../models/Lesson');
            await Lesson.findByIdAndUpdate(resource.lessonId, {
                $pull: { resources: resource._id }
            });
        }

        await resource.deleteOne();

        return successResponse(res, 200, 'Resource deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllResources,
    getResourceById,
    createResource,
    deleteResource
};
