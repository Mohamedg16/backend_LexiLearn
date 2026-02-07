const Task = require('../models/Task');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Public (or Private depending on requirements, assuming Public for now to fix 404)
exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Public
exports.getTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Admin/Teacher) - keeping it open for now or adding stub
exports.createTask = async (req, res) => {
    try {
        const task = await Task.create(req.body);

        res.status(201).json({
            success: true,
            data: task
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
