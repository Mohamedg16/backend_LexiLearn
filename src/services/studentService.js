const Student = require('../models/Student');
const Module = require('../models/Module');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const SpeakingSubmission = require('../models/SpeakingSubmission');
const { calculatePercentage } = require('../utils/helpers');

/**
 * Get student dashboard data
 * @param {String} userId - User ID
 * @returns {Object} Dashboard data
 */
const getStudentDashboard = async (userId) => {
    const student = await Student.findOne({ userId })
        .populate('enrolledModules', 'title thumbnail category level');

    if (!student) {
        throw new Error('Student profile not found');
    }

    // Get progress for all enrolled modules
    const progressData = await Progress.find({ studentId: student._id })
        .populate('moduleId', 'title');

    // Get speaking submissions for stats and latest record
    const submissions = await SpeakingSubmission.find({ studentId: student._id })
        .sort({ createdAt: -1 });

    const latestSubmission = submissions.length > 0 ? submissions[0] : null;

    let avgLexicalDensity = 0;
    let avgLexicalDiversity = 0;

    if (submissions.length > 0) {
        avgLexicalDensity = submissions.reduce((acc, curr) => acc + (curr.lexicalDensity || 0), 0) / submissions.length;
        avgLexicalDiversity = submissions.reduce((acc, curr) => acc + (curr.lexicalDiversity || 0), 0) / submissions.length;
    }

    // Calculate overall statistics
    const stats = {
        totalStudyHours: student.totalStudyHours,
        totalLessonsCompleted: student.totalLessonsCompleted,
        currentStreak: student.currentStreak,
        enrolledModulesCount: student.enrolledModules.length,
        achievements: student.achievements.length,
        avgLexicalDensity,
        avgLexicalDiversity
    };

    return {
        student,
        stats,
        latestSubmission,
        progressData,
        recentModules: student.enrolledModules.slice(0, 5)
    };
};

/**
 * Enroll student in a module
 * @param {String} userId - User ID
 * @param {String} moduleId - Module ID
 */
const enrollInModule = async (userId, moduleId) => {
    const student = await Student.findOne({ userId });
    if (!student) {
        throw new Error('Student profile not found');
    }

    const module = await Module.findById(moduleId);
    if (!module) {
        throw new Error('Module not found');
    }

    if (!module.isPublished) {
        throw new Error('Module is not available for enrollment');
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
        studentId: student._id,
        moduleId
    });

    if (existingEnrollment) {
        throw new Error('Already enrolled in this module');
    }

    // Create enrollment
    await Enrollment.create({
        studentId: student._id,
        moduleId
    });

    // Add to student's enrolled modules
    student.enrolledModules.push(moduleId);
    await student.save();

    // Update module enrollment count
    module.enrolledStudentsCount += 1;
    await module.save();

    // Create initial progress record
    await Progress.create({
        studentId: student._id,
        moduleId,
        lessonsCompleted: [],
        overallProgress: 0,
        totalTimeSpent: 0,
        status: 'not_started'
    });

    return { message: 'Successfully enrolled in module' };
};

/**
 * Update lesson progress
 * @param {String} userId - User ID
 * @param {String} lessonId - Lesson ID
 * @param {Number} timeSpent - Time spent in minutes
 */
const updateLessonProgress = async (userId, lessonId, timeSpent = 0) => {
    const student = await Student.findOne({ userId });
    if (!student) {
        throw new Error('Student profile not found');
    }

    const Lesson = require('../models/Lesson');
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new Error('Lesson not found');
    }

    // Find or create progress record
    let progress = await Progress.findOne({
        studentId: student._id,
        moduleId: lesson.moduleId
    });

    if (!progress) {
        throw new Error('Not enrolled in this module');
    }

    // Check if lesson already completed
    const alreadyCompleted = progress.lessonsCompleted.some(
        lc => lc.lessonId.toString() === lessonId
    );

    if (!alreadyCompleted) {
        // Add to completed lessons
        progress.lessonsCompleted.push({
            lessonId,
            completedAt: new Date(),
            timeSpent
        });

        // Update student stats
        student.totalLessonsCompleted += 1;
        student.totalStudyHours += timeSpent / 60;
        await student.save();
    }

    // Update total time spent
    progress.totalTimeSpent += timeSpent;
    progress.lastAccessedAt = new Date();

    // Calculate overall progress
    const module = await Module.findById(lesson.moduleId).populate('lessons');
    const totalLessons = module.lessons.length;
    const completedLessons = progress.lessonsCompleted.length;
    progress.overallProgress = calculatePercentage(completedLessons, totalLessons);

    // Update status
    if (progress.overallProgress === 100) {
        progress.status = 'completed';
    } else if (progress.overallProgress > 0) {
        progress.status = 'in_progress';
    }

    await progress.save();

    return progress;
};

module.exports = {
    getStudentDashboard,
    enrollInModule,
    updateLessonProgress
};
