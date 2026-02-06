const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Resource = require('../models/Resource');
const Video = require('../models/Video');
const Payment = require('../models/Payment');
const SpeakingSubmission = require('../models/SpeakingSubmission');
const SystemLog = require('../models/SystemLog');
const Message = require('../models/Message');
const { successResponse, createPagination } = require('../utils/helpers');
const bcrypt = require('bcrypt');

/**
 * Get all users with filters and pagination
 * GET /api/admin/users
 */
const getAllUsers = async (req, res, next) => {
    try {
        const { search, role, status, page = 1, limit = 20 } = req.query;

        const filters = {};

        // Search filter
        if (search) {
            filters.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Role filter
        if (role) filters.role = role;

        // Status filter
        if (status) filters.isActive = status === 'active';

        const users = await User.find(filters)
            .select('-password -refreshToken')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(filters);
        const pagination = createPagination(page, limit, total);

        return successResponse(res, 200, 'Users retrieved', users, pagination);
    } catch (error) {
        next(error);
    }
};

/**
 * Get user details
 * GET /api/admin/users/:id
 */
const getUserDetails = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password -refreshToken');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get role-specific data
        let roleData = null;
        if (user.role === 'student') {
            roleData = await Student.findOne({ userId: user._id })
                .populate('enrolledModules', 'title');
        } else if (user.role === 'teacher') {
            roleData = await Teacher.findOne({ userId: user._id })
                .populate('assignedModules', 'title');
        }

        return successResponse(res, 200, 'User details retrieved', {
            user,
            roleData
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user
 * PUT /api/admin/users/:id
 */
const updateUser = async (req, res, next) => {
    try {
        const { fullName, email, isActive, hourlyRate } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { fullName, email, isActive },
            { new: true, runValidators: true }
        ).select('-password -refreshToken');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'teacher' && hourlyRate !== undefined) {
            await Teacher.findOneAndUpdate(
                { userId: user._id },
                { hourlyRate },
                { new: true }
            );
        }

        await SystemLog.create({
            userId: req.user._id,
            action: `Updated user: ${user.email} (Role: ${user.role})`,
            method: 'PUT',
            endpoint: `/api/admin/users/${req.params.id}`,
            status: 200,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        return successResponse(res, 200, 'User updated successfully', user);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'student') {
            await Student.findOneAndDelete({ userId: user._id });
        } else if (user.role === 'teacher') {
            await Teacher.findOneAndDelete({ userId: user._id });
        }

        await SystemLog.create({
            userId: req.user._id,
            action: `Deleted user: ${user.email}`,
            method: 'DELETE',
            endpoint: `/api/admin/users/${req.params.id}`,
            status: 200,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        return successResponse(res, 200, 'User deleted successfully', null);
    } catch (error) {
        next(error);
    }
};

/**
 * Reset user password
 * POST /api/admin/users/:id/reset-password
 */
const resetUserPassword = async (req, res, next) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, message: 'New password is required' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { password: hashedPassword },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await SystemLog.create({
            userId: req.user._id,
            action: `Reset password for user: ${user.email}`,
            method: 'POST',
            endpoint: `/api/admin/users/${req.params.id}/reset-password`,
            status: 200,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        return successResponse(res, 200, 'Password reset successfully', null);
    } catch (error) {
        next(error);
    }
};

/**
 * Suspend user
 * PATCH /api/admin/users/:id/suspend
 */
const suspendUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        ).select('-password -refreshToken');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return successResponse(res, 200, 'User suspended successfully', user);
    } catch (error) {
        next(error);
    }
};

/**
 * Activate user
 * PATCH /api/admin/users/:id/activate
 */
const activateUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: true },
            { new: true }
        ).select('-password -refreshToken');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return successResponse(res, 200, 'User activated successfully', user);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all students with filters
 * GET /api/admin/students
 */
const getAllStudents = async (req, res, next) => {
    try {
        const { level, status, page = 1, limit = 20 } = req.query;

        const filters = {};
        if (level) filters.level = level;
        if (status) filters.subscriptionStatus = status;

        const students = await Student.find(filters)
            .populate('userId', 'fullName email profilePicture isActive')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Student.countDocuments(filters);
        const pagination = createPagination(page, limit, total);

        return successResponse(res, 200, 'Students retrieved', students, pagination);
    } catch (error) {
        next(error);
    }
};

/**
 * Update student monthly payment status
 * PATCH /api/admin/students/:id/payment-status
 */
const updateStudentPaymentStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            {
                monthlyPaymentStatus: status,
                lastPaymentDate: status === 'paid' ? new Date() : undefined
            },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        return successResponse(res, 200, `Student payment status updated to ${status}`, student);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all teachers
 * GET /api/admin/teachers
 */
const getAllTeachers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const teachers = await Teacher.find()
            .populate('userId', 'fullName email profilePicture isActive')
            .populate('assignedModules', 'title')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Teacher.countDocuments();
        const pagination = createPagination(page, limit, total);

        return successResponse(res, 200, 'Teachers retrieved', teachers, pagination);
    } catch (error) {
        next(error);
    }
};

/**
 * Create new teacher (Admin Onboarding)
 * POST /api/admin/teachers
 */
const createTeacher = async (req, res, next) => {
    try {
        const { fullName, email, password, assignedModules, hourlyRate } = req.body;

        const authService = require('../services/authService');
        const result = await authService.registerUser({
            fullName,
            email,
            password: password || 'Faculty2024!', // Default password
            role: 'teacher',
            assignedModules,
            hourlyRate
        });

        return successResponse(res, 201, 'Teacher onboarded successfully', result.user);
    } catch (error) {
        if (error.message === 'Email already registered') {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

/**
 * Create module
 * POST /api/admin/modules
 */
const createModule = async (req, res, next) => {
    try {
        const module = await Module.create({
            ...req.body,
            createdBy: req.user._id
        });

        return successResponse(res, 201, 'Module created successfully', module);
    } catch (error) {
        next(error);
    }
};

/**
 * Update module
 * PUT /api/admin/modules/:id
 */
const updateModule = async (req, res, next) => {
    try {
        const module = await Module.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!module) {
            return res.status(404).json({
                success: false,
                message: 'Module not found'
            });
        }

        return successResponse(res, 200, 'Module updated successfully', module);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete module
 * DELETE /api/admin/modules/:id
 */
const deleteModule = async (req, res, next) => {
    try {
        const module = await Module.findByIdAndDelete(req.params.id);

        if (!module) {
            return res.status(404).json({
                success: false,
                message: 'Module not found'
            });
        }

        // Delete associated lessons and resources
        await Lesson.deleteMany({ moduleId: module._id });

        return successResponse(res, 200, 'Module deleted successfully', null);
    } catch (error) {
        next(error);
    }
};

/**
 * Create lesson
 * POST /api/admin/lessons
 */
const createLesson = async (req, res, next) => {
    try {
        const lesson = await Lesson.create(req.body);

        // Add lesson to module if provided
        if (req.body.moduleId) {
            await Module.findByIdAndUpdate(
                req.body.moduleId,
                { $push: { lessons: lesson._id } }
            );
        }

        return successResponse(res, 201, 'Lesson created successfully', lesson);
    } catch (error) {
        next(error);
    }
};

/**
 * Update lesson
 * PUT /api/admin/lessons/:id
 */
const updateLesson = async (req, res, next) => {
    try {
        const lesson = await Lesson.findByIdAndUpdate(
            req.params.id,
            req.body,
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
 * DELETE /api/admin/lessons/:id
 */
const deleteLesson = async (req, res, next) => {
    try {
        const lesson = await Lesson.findByIdAndDelete(req.params.id);

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        if (lesson.moduleId) {
            await Module.findByIdAndUpdate(
                lesson.moduleId,
                { $pull: { lessons: lesson._id } }
            );
        }

        // Delete associated resources
        await Resource.deleteMany({ lessonId: lesson._id });

        return successResponse(res, 200, 'Lesson deleted successfully', null);
    } catch (error) {
        next(error);
    }
};

/**
 * Create resource
 * POST /api/admin/resources
 */
const createResource = async (req, res, next) => {
    try {
        const resource = await Resource.create(req.body);

        // Add resource to lesson if provided
        if (req.body.lessonId) {
            await Lesson.findByIdAndUpdate(
                req.body.lessonId,
                { $push: { resources: resource._id } }
            );
        }

        return successResponse(res, 201, 'Resource created successfully', resource);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete resource
 * DELETE /api/admin/resources/:id
 */
const deleteResource = async (req, res, next) => {
    try {
        const resource = await Resource.findByIdAndDelete(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        if (resource.lessonId) {
            await Lesson.findByIdAndUpdate(
                resource.lessonId,
                { $pull: { resources: resource._id } }
            );
        }

        return successResponse(res, 200, 'Resource deleted successfully', null);
    } catch (error) {
        next(error);
    }
};

/**
 * Create video
 * POST /api/admin/videos
 */
const createVideo = async (req, res, next) => {
    try {
        const video = await Video.create(req.body);
        return successResponse(res, 201, 'Video created successfully', video);
    } catch (error) {
        next(error);
    }
};

/**
 * Update video
 * PUT /api/admin/videos/:id
 */
const updateVideo = async (req, res, next) => {
    try {
        const video = await Video.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        return successResponse(res, 200, 'Video updated successfully', video);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete video
 * DELETE /api/admin/videos/:id
 */
const deleteVideo = async (req, res, next) => {
    try {
        const video = await Video.findByIdAndDelete(req.params.id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        return successResponse(res, 200, 'Video deleted successfully', null);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all videos
 * GET /api/admin/videos
 */
const getAllVideos = async (req, res, next) => {
    try {
        const videos = await Video.find().sort({ createdAt: -1 });
        return successResponse(res, 200, 'Videos retrieved', videos);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all resources
 * GET /api/admin/resources
 */
const getAllResources = async (req, res, next) => {
    try {
        const resources = await Resource.find().populate('lessonId', 'title');
        return successResponse(res, 200, 'Resources retrieved', resources);
    } catch (error) {
        next(error);
    }
};

/**
 * Get platform statistics
 * GET /api/admin/statistics/overview
 */
const getPlatformStatistics = async (req, res, next) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalTeachers = await User.countDocuments({ role: 'teacher' });
        const totalModules = await Module.countDocuments();
        const totalLessons = await Lesson.countDocuments();

        const revenue = await Payment.aggregate([
            { $match: { status: 'paid', type: 'subscription' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const activeToday = await User.countDocuments({
            lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        const recentStudents = await Student.find()
            .populate('userId', 'fullName email profilePicture')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentTeachers = await Teacher.find()
            .populate('userId', 'fullName email profilePicture')
            .sort({ createdAt: -1 })
            .limit(5);

        const stats = {
            totalStudents,
            totalTeachers,
            totalModules,
            totalLessons,
            totalRevenue: revenue[0]?.total || 0,
            activeToday,
            recentStudents,
            recentTeachers
        };

        return successResponse(res, 200, 'Platform statistics retrieved', stats);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all payments
 * GET /api/admin/payments
 */
const getAllPayments = async (req, res, next) => {
    try {
        const { status, type, page = 1, limit = 20 } = req.query;

        const filters = {};
        if (status) filters.status = status;
        if (type) filters.type = type;

        const payments = await Payment.find(filters)
            .populate('userId', 'fullName email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Payment.countDocuments(filters);
        const pagination = createPagination(page, limit, total);

        return successResponse(res, 200, 'Payments retrieved', payments, pagination);
    } catch (error) {
        next(error);
    }
};

/**
 * Update resource
 * PUT /api/admin/resources/:id
 */
const updateResource = async (req, res, next) => {
    try {
        const { title, type, url, lessonId } = req.body;
        const resourceId = req.params.id;

        const oldResource = await Resource.findById(resourceId);
        if (!oldResource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        const resource = await Resource.findByIdAndUpdate(
            resourceId,
            { title, type, url, lessonId },
            { new: true, runValidators: true }
        );

        // If lesson changed, update Lesson references
        if (lessonId && oldResource.lessonId?.toString() !== lessonId.toString()) {
            // Remove from old lesson
            if (oldResource.lessonId) {
                await Lesson.findByIdAndUpdate(
                    oldResource.lessonId,
                    { $pull: { resources: resourceId } }
                );
            }
            // Add to new lesson
            await Lesson.findByIdAndUpdate(
                lessonId,
                { $push: { resources: resourceId } }
            );
        }

        return successResponse(res, 200, 'Resource updated successfully', resource);
    } catch (error) {
        next(error);
    }
};

/**
 * Get system health metrics
 * GET /api/admin/system/health
 */
const getSystemHealth = async (req, res, next) => {
    try {
        const [users, students, teachers, modules, lessons, submissions, resources, videos] = await Promise.all([
            User.countDocuments(),
            Student.countDocuments(),
            Teacher.countDocuments(),
            Module.countDocuments(),
            Lesson.countDocuments(),
            SpeakingSubmission.countDocuments(),
            Resource.countDocuments(),
            Video.countDocuments()
        ]);

        const health = {
            counts: {
                users,
                students,
                teachers,
                modules,
                lessons,
                submissions,
                resources,
                videos
            },
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform
        };

        return successResponse(res, 200, 'System health retrieved', health);
    } catch (error) {
        next(error);
    }
};

/**
 * Get system logs
 * GET /api/admin/system/logs
 */
const getSystemLogs = async (req, res, next) => {
    try {
        const logs = await SystemLog.find()
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 })
            .limit(50);

        return successResponse(res, 200, 'System logs retrieved', logs);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all messages from contact form
 * GET /api/admin/messages
 */
const getAllMessages = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, isRead } = req.query;

        const filters = {};
        if (isRead !== undefined) filters.isRead = isRead === 'true';

        const messages = await Message.find(filters)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Message.countDocuments(filters);
        const pagination = createPagination(page, limit, total);

        return successResponse(res, 200, 'Messages retrieved', messages, pagination);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a message
 * DELETE /api/admin/messages/:id
 */
const deleteMessage = async (req, res, next) => {
    try {
        const message = await Message.findByIdAndDelete(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        await SystemLog.create({
            userId: req.user._id,
            action: `Deleted message from: ${message.email}`,
            method: 'DELETE',
            endpoint: `/api/admin/messages/${req.params.id}`,
            status: 200,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        return successResponse(res, 200, 'Message deleted successfully', null);
    } catch (error) {
        next(error);
    }
};

/**
 * Mark message as read
 * PATCH /api/admin/messages/:id/read
 */
const markMessageAsRead = async (req, res, next) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        return successResponse(res, 200, 'Message marked as read', message);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllUsers,
    getUserDetails,
    updateUser,
    deleteUser,
    resetUserPassword,
    suspendUser,
    activateUser,
    getAllStudents,
    getAllTeachers,
    createTeacher,
    createModule,
    updateModule,
    deleteModule,
    createLesson,
    updateLesson,
    deleteLesson,
    createResource,
    updateResource,
    deleteResource,
    createVideo,
    updateVideo,
    deleteVideo,
    getPlatformStatistics,
    getAllPayments,
    updateStudentPaymentStatus,
    getAllVideos,
    getAllResources,
    getSystemHealth,
    getSystemLogs,
    getAllMessages,
    deleteMessage,
    markMessageAsRead
};
