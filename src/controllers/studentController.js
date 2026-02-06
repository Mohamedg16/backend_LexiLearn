const studentService = require('../services/studentService');
const Student = require('../models/Student');
const Progress = require('../models/Progress');
const SpeakingSubmission = require('../models/SpeakingSubmission');
const { successResponse } = require('../utils/helpers');

/**
 * Get student dashboard
 * GET /api/students/dashboard
 */
const getDashboard = async (req, res, next) => {
    try {
        const data = await studentService.getStudentDashboard(req.user._id);
        return successResponse(res, 200, 'Dashboard data retrieved', data);
    } catch (error) {
        next(error);
    }
};

/**
 * Get student profile
 * GET /api/students/profile
 */
const getProfile = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user._id })
            .populate('userId', 'fullName email profilePicture')
            .populate('enrolledModules', 'title category level');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        return successResponse(res, 200, 'Profile retrieved', student);
    } catch (error) {
        next(error);
    }
};

/**
 * Update student profile
 * PUT /api/students/profile
 */
const updateProfile = async (req, res, next) => {
    try {
        const { level } = req.body;
        const User = require('../models/User');

        // Update user fields
        if (req.body.fullName || req.body.email || req.body.profilePicture) {
            await User.findByIdAndUpdate(req.user._id, {
                fullName: req.body.fullName,
                email: req.body.email,
                profilePicture: req.body.profilePicture
            });
        }

        // Update student-specific fields
        if (level) {
            await Student.findOneAndUpdate(
                { userId: req.user._id },
                { level }
            );
        }

        return successResponse(res, 200, 'Profile updated successfully', null);
    } catch (error) {
        next(error);
    }
};

/**
 * Enroll in module
 * POST /api/students/modules/:id/enroll
 */
const enrollInModule = async (req, res, next) => {
    try {
        const result = await studentService.enrollInModule(req.user._id, req.params.id);
        return successResponse(res, 200, result.message, null);
    } catch (error) {
        next(error);
    }
};

/**
 * Get enrolled modules
 * GET /api/students/my-modules
 */
const getEnrolledModules = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user._id })
            .populate({
                path: 'enrolledModules',
                populate: {
                    path: 'assignedTeacher',
                    select: 'fullName'
                }
            });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        return successResponse(res, 200, 'Enrolled modules retrieved', student.enrolledModules);
    } catch (error) {
        next(error);
    }
};

/**
 * Get progress for a module
 * GET /api/students/progress/:moduleId
 */
const getModuleProgress = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });

        const progress = await Progress.findOne({
            studentId: student._id,
            moduleId: req.params.moduleId
        }).populate('lessonsCompleted.lessonId', 'title');

        if (!progress) {
            return res.status(404).json({
                success: false,
                message: 'Progress not found'
            });
        }

        return successResponse(res, 200, 'Progress retrieved', progress);
    } catch (error) {
        next(error);
    }
};

/**
 * Mark lesson as complete
 * POST /api/students/progress/lesson-complete
 */
const markLessonComplete = async (req, res, next) => {
    try {
        const { lessonId, timeSpent } = req.body;
        const progress = await studentService.updateLessonProgress(
            req.user._id,
            lessonId,
            timeSpent || 0
        );

        return successResponse(res, 200, 'Lesson marked as complete', progress);
    } catch (error) {
        next(error);
    }
};

/**
 * Get student statistics
 * GET /api/students/statistics
 */
const getStatistics = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });

        const stats = {
            totalStudyHours: student.totalStudyHours,
            totalLessonsCompleted: student.totalLessonsCompleted,
            currentStreak: student.currentStreak,
            enrolledModulesCount: student.enrolledModules.length,
            achievements: student.achievements,
            level: student.level,
            subscriptionStatus: student.subscriptionStatus
        };

        return successResponse(res, 200, 'Statistics retrieved', stats);
    } catch (error) {
        next(error);
    }
};

/**
 * Get student speaking history
 * GET /api/students/speaking-history
 */
const getSpeakingHistory = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        const submissions = await SpeakingSubmission.find({ studentId: student._id })
            .populate('taskId', 'title prompt')
            .sort({ createdAt: -1 });

        return successResponse(res, 200, 'Speaking history retrieved', submissions);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all available videos (from Lessons and standalone Video library)
 * GET /api/students/videos
 */
const getAllVideos = async (req, res, next) => {
    try {
        const Lesson = require('../models/Lesson');
        const Video = require('../models/Video');

        // Fetch lessons with videos
        const lessonVideos = await Lesson.find({
            videoUrl: { $ne: null, $ne: '' }
        }).populate('moduleId', 'title category level');

        // Fetch standalone videos
        const standaloneVideos = await Video.find();

        // Standardize both types to a common format for the frontend
        const formattedLessonVideos = lessonVideos.map(l => ({
            _id: l._id,
            title: l.title,
            description: l.description,
            youtubeUrl: l.videoUrl, // Lesson uses videoUrl
            thumbnailUrl: l.thumbnailUrl,
            duration: l.duration,
            moduleId: l.moduleId,
            type: 'lesson-video'
        }));

        const formattedStandaloneVideos = standaloneVideos.map(v => ({
            _id: v._id,
            title: v.title,
            description: v.description,
            youtubeUrl: v.youtubeUrl, // Video uses youtubeUrl
            thumbnailUrl: v.thumbnail,
            duration: v.duration,
            category: v.category,
            type: 'standalone-video'
        }));

        const allVideos = [...formattedLessonVideos, ...formattedStandaloneVideos];

        return successResponse(res, 200, 'Videos retrieved from all nodes', allVideos);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a speaking submission
 * DELETE /api/students/speaking-history/:id
 */
const deleteSpeakingHistory = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const submission = await SpeakingSubmission.findOneAndDelete({
            _id: req.params.id,
            studentId: student._id
        });

        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        return successResponse(res, 200, 'Submission deleted successfully', null);
    } catch (error) {
        next(error);
    }
};

/**
 * Get unified AI history (text and voice)
 * GET /api/students/ai-history
 */
const getAIHistory = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const Conversation = require('../models/Conversation');
        const [textConversations, speakingSubmissions] = await Promise.all([
            Conversation.find({ studentId: student._id }).select('title messages createdAt updatedAt').sort({ updatedAt: -1 }),
            SpeakingSubmission.find({ studentId: student._id }).populate('taskId', 'title').sort({ createdAt: -1 })
        ]);

        const textHistory = textConversations.map(item => ({
            ...item._doc,
            type: 'text',
            displayDate: item.updatedAt || item.createdAt
        }));

        const voiceHistory = speakingSubmissions.map(item => ({
            ...item._doc,
            type: 'voice',
            title: item.taskId?.title || item.topic || 'Practice Session',
            displayDate: item.createdAt
        }));

        const combined = [...textHistory, ...voiceHistory].sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate));

        return successResponse(res, 200, 'AI history retrieved', combined);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboard,
    getProfile,
    updateProfile,
    enrollInModule,
    getEnrolledModules,
    getModuleProgress,
    markLessonComplete,
    getStatistics,
    getSpeakingHistory,
    deleteSpeakingHistory,
    getAIHistory,
    getAllVideos
};
