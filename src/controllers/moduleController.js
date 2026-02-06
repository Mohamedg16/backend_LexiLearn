const Module = require('../models/Module');
const { successResponse, createPagination } = require('../utils/helpers');

/**
 * Get all modules with filters
 * GET /api/modules
 */
const getAllModules = async (req, res, next) => {
    try {
        const { category, level, search, page = 1, limit = 20 } = req.query;

        const filters = { isPublished: true };

        if (category) filters.category = category;
        if (level) filters.level = level;
        if (search) {
            filters.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const modules = await Module.find(filters)
            .populate('assignedTeacher', 'fullName')
            .populate({
                path: 'lessons',
                populate: {
                    path: 'resources'
                }
            })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Module.countDocuments(filters);
        const pagination = createPagination(page, limit, total);

        return successResponse(res, 200, 'Modules retrieved', modules, pagination);
    } catch (error) {
        next(error);
    }
};

/**
 * Get module by ID
 * GET /api/modules/:id
 */
const getModuleById = async (req, res, next) => {
    try {
        const module = await Module.findById(req.params.id)
            .populate('assignedTeacher', 'fullName email')
            .populate('lessons');

        if (!module) {
            return res.status(404).json({
                success: false,
                message: 'Module not found'
            });
        }

        return successResponse(res, 200, 'Module retrieved', module);
    } catch (error) {
        next(error);
    }
};

/**
 * Get module lessons
 * GET /api/modules/:id/lessons
 */
const getModuleLessons = async (req, res, next) => {
    try {
        const Lesson = require('../models/Lesson');

        const filter = { moduleId: req.params.id };
        if (req.user.role === 'student') {
            filter.isPublished = true;
        }

        const lessons = await Lesson.find(filter)
            .populate('resources')
            .sort({ order: 1 });

        return successResponse(res, 200, 'Lessons retrieved', lessons);
    } catch (error) {
        next(error);
    }
};

/**
 * Get modules by category
 * GET /api/modules/category/:category
 */
const getModulesByCategory = async (req, res, next) => {
    try {
        const modules = await Module.find({
            category: req.params.category,
            isPublished: true
        }).populate('assignedTeacher', 'fullName');

        return successResponse(res, 200, 'Modules retrieved', modules);
    } catch (error) {
        next(error);
    }
};

/**
 * Get modules by level
 * GET /api/modules/level/:level
 */
const getModulesByLevel = async (req, res, next) => {
    try {
        const modules = await Module.find({
            level: req.params.level,
            isPublished: true
        }).populate('assignedTeacher', 'fullName');

        return successResponse(res, 200, 'Modules retrieved', modules);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllModules,
    getModuleById,
    getModuleLessons,
    getModulesByCategory,
    getModulesByLevel
};
