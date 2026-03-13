const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Progress = require('../models/Progress');
const SpeakingSubmission = require('../models/SpeakingSubmission');
const Task = require('../models/Task');
const { successResponse } = require('../utils/helpers');

/**
 * Get teacher dashboard
 * GET /api/teachers/dashboard
 */
const getDashboard = async (req, res, next) => {
    try {
        const teacher = await Teacher.findOne({ userId: req.user._id })
            .populate('assignedModules', 'title enrolledStudentsCount')
            .lean();

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher profile not found'
            });
        }

        const studentIds = teacher.students || [];

        const [statsData, activeTasksCount] = await Promise.all([
            SpeakingSubmission.aggregate([
                { $match: { studentId: { $in: studentIds } } },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        avgLexicalDiversity: { $avg: "$lexicalDiversity" }
                    }
                }
            ]),
            Task.countDocuments({ isActive: true })
        ]);

        const statsResult = statsData[0] || { count: 0, avgLexicalDiversity: 0 };

        const stats = {
            totalTeachingHours: teacher.totalTeachingHours,
            totalEarnings: teacher.totalEarnings,
            pendingPayment: teacher.pendingPayment,
            assignedModulesCount: teacher.assignedModules.length,
            studentsCount: studentIds.length,
            speakingSessionsCount: statsResult.count,
            activeTasksCount,
            avgLexicalDiversity: parseFloat((statsResult.avgLexicalDiversity || 0).toFixed(1))
        };

        return successResponse(res, 200, 'Dashboard data retrieved', {
            teacher,
            stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get student detail for teacher
 * GET /api/teachers/students/:id
 */
const getStudentDetail = async (req, res, next) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('userId', 'fullName email profilePicture')
            .lean();

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const speakingSubmissions = await SpeakingSubmission.find({ studentId: req.params.id })
            .populate('taskId', 'title')
            .sort({ createdAt: -1 })
            .lean();

        const moduleProgress = await Progress.find({ studentId: req.params.id })
            .populate('moduleId', 'title')
            .populate('lessonsCompleted.lessonId', 'title')
            .lean();

        return successResponse(res, 200, 'Student detail retrieved', {
            ...student,
            speakingSubmissions,
            moduleProgress
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get teacher profile
 * GET /api/teachers/profile
 */
const getProfile = async (req, res, next) => {
    try {
        const teacher = await Teacher.findOne({ userId: req.user._id })
            .populate('userId', 'fullName email profilePicture')
            .populate('assignedModules', 'title category level')
            .lean();

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher profile not found'
            });
        }

        return successResponse(res, 200, 'Profile retrieved', teacher);
    } catch (error) {
        next(error);
    }
};

/**
 * Get assigned students
 * GET /api/teachers/students
 */
const getStudents = async (req, res, next) => {
    try {
        const teacher = await Teacher.findOne({ userId: req.user._id })
            .populate({
                path: 'students',
                populate: {
                    path: 'userId',
                    select: 'fullName email profilePicture lastLogin'
                }
            })
            .lean();

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher profile not found'
            });
        }

        return successResponse(res, 200, 'Students retrieved', teacher.students);
    } catch (error) {
        next(error);
    }
};

/**
 * Get student progress
 * GET /api/teachers/students/:id/progress
 */
const getStudentProgress = async (req, res, next) => {
    try {
        const studentProgress = await Progress.find({ studentId: req.params.id })
            .populate('moduleId', 'title')
            .populate('lessonsCompleted.lessonId', 'title')
            .lean();

        return successResponse(res, 200, 'Student progress retrieved', studentProgress);
    } catch (error) {
        next(error);
    }
};

/**
 * Get assigned modules
 * GET /api/teachers/modules
 */
const getModules = async (req, res, next) => {
    try {
        const teacher = await Teacher.findOne({ userId: req.user._id })
            .populate('assignedModules')
            .lean();

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher profile not found'
            });
        }

        return successResponse(res, 200, 'Modules retrieved', teacher.assignedModules);
    } catch (error) {
        next(error);
    }
};

/**
 * Get payment history
 * GET /api/teachers/payments
 */
const getPayments = async (req, res, next) => {
    try {
        const teacher = await Teacher.findOne({ userId: req.user._id }).lean();

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher profile not found'
            });
        }

        return successResponse(res, 200, 'Payment history retrieved', {
            paymentHistory: teacher.paymentHistory,
            totalEarnings: teacher.totalEarnings,
            pendingPayment: teacher.pendingPayment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get analytics for ALL students - OPTIMIZED
 * GET /api/teachers/analytics
 */
const getAnalytics = async (req, res, next) => {
    try {
        console.log('📊 Fetching analytics for all students...');

        // Optimize: Use aggregation with limits for ALL students
        const [overviewData, dailyActivityData] = await Promise.all([
            SpeakingSubmission.aggregate([
                { $sort: { createdAt: -1 } },
                { $limit: 200 }, // Only analyze recent 200 submissions
                {
                    $group: {
                        _id: null,
                        totalAssessments: { $sum: 1 },
                        avgSophistication: { $avg: "$lexicalSophistication" },
                        avgDiversity: { $avg: "$lexicalDiversity" },
                        avgDensity: { $avg: "$lexicalDensity" },
                        uniqueStudents: { $addToSet: "$studentId" }
                    }
                },
                {
                    $project: {
                        totalAssessments: 1,
                        avgSophistication: 1,
                        avgDiversity: 1,
                        avgDensity: 1,
                        activeCohortCount: { $size: "$uniqueStudents" }
                    }
                }
            ]),
            // Optimize daily activity
            (async () => {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
                sevenDaysAgo.setHours(0, 0, 0, 0);

                const stats = await SpeakingSubmission.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: sevenDaysAgo }
                        }
                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { "_id": 1 } }
                ]);

                // Fill in gaps
                const daily = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;

                    const record = stats.find(s => s._id === dateStr);
                    daily.push({
                        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                        fullDate: dateStr,
                        count: record ? record.count : 0
                    });
                }
                return daily;
            })()
        ]);

        const overview = overviewData[0] || { 
            totalAssessments: 0, 
            avgSophistication: 0, 
            avgDiversity: 0, 
            avgDensity: 0,
            activeCohortCount: 0
        };

        console.log(`✅ Analytics: ${overview.totalAssessments} assessments, ${overview.activeCohortCount} active students`);

        return successResponse(res, 200, 'Analytics retrieved', {
            overview: {
                totalAssessments: overview.totalAssessments,
                avgSophistication: parseFloat((overview.avgSophistication || 0).toFixed(1)),
                avgDiversity: parseFloat((overview.avgDiversity || 0).toFixed(1)),
                avgDensity: parseFloat((overview.avgDensity || 0).toFixed(1)),
                activeCohortCount: overview.activeCohortCount || 0
            },
            interactionFrequency: dailyActivityData
        });
    } catch (error) {
        console.error('❌ Error fetching analytics:', error);
        next(error);
    }
};

/**
 * Optimized Init Endpoint - Shows ALL students
 * GET /api/teachers/init
 */
const getInitData = async (req, res, next) => {
    try {
        const teacher = await Teacher.findOne({ userId: req.user._id })
            .populate('assignedModules', 'title category level')
            .lean();

        if (!teacher) {
            // Create teacher profile if doesn't exist
            const newTeacher = new Teacher({
                userId: req.user._id,
                students: [],
                assignedModules: [],
                totalTeachingHours: 0,
                totalEarnings: 0,
                pendingPayment: 0
            });
            await newTeacher.save();
        }

        // Get ALL students count
        const allStudentsCount = await Student.countDocuments();

        const [dbStats, activeTasks, recentSubmissions] = await Promise.all([
            SpeakingSubmission.aggregate([
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        avgDiversity: { $avg: "$lexicalDiversity" },
                        uniqueStudents: { $addToSet: "$studentId" }
                    }
                },
                {
                    $project: {
                        count: 1,
                        avgDiversity: 1,
                        uniqueCount: { $size: "$uniqueStudents" }
                    }
                }
            ]),
            Task.find({ isActive: true }).select('title timeLimit timePoint').lean(),
            SpeakingSubmission.find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .select('studentId topic wordCount lexicalDiversity createdAt')
                .populate({
                    path: 'studentId',
                    select: 'userId',
                    populate: { path: 'userId', select: 'fullName' }
                })
                .lean()
        ]);

        const statsResult = dbStats[0] || { count: 0, avgDiversity: 0, uniqueCount: 0 };

        const stats = {
            totalTeachingHours: teacher?.totalTeachingHours || 0,
            totalEarnings: teacher?.totalEarnings || 0,
            pendingPayment: teacher?.pendingPayment || 0,
            assignedModulesCount: teacher?.assignedModules?.length || 0,
            studentsCount: allStudentsCount,
            speakingSessionsCount: statsResult.count,
            activeTasksCount: activeTasks.length,
            avgLexicalDiversity: parseFloat((statsResult.avgDiversity || 0).toFixed(1)),
            activeCohortCount: statsResult.uniqueCount || 0
        };

        return successResponse(res, 200, 'Init data retrieved', {
            teacher,
            stats,
            activeTasks,
            recentSubmissions
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Export Speaking Scores for a task
 * GET /api/teachers/export/scores/:taskId
 */
const exportSpeakingScores = async (req, res, next) => {
    try {
        const taskId = req.params.taskId;
        const submissions = await SpeakingSubmission.find({ taskId })
            .populate('studentId', 'userId')
            .populate({ path: 'studentId', populate: { path: 'userId', select: 'fullName' } });

        const csvData = [
            ['Student Name', 'Word Count', 'Diversity (%)', 'Sophistication (%)', 'Date'],
            ...submissions.map(s => [
                s.studentId?.userId?.fullName || 'Unknown',
                s.wordCount,
                s.lexicalDiversity,
                s.lexicalSophistication,
                new Date(s.createdAt).toLocaleDateString()
            ])
        ].map(row => row.join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=scores-${taskId}.csv`);
        return res.status(200).send(csvData);
    } catch (error) {
        next(error);
    }
};

/**
 * Fetch Full AI JSON Report
 * GET /api/teachers/export/ai-report/:id
 */
const exportAiReport = async (req, res, next) => {
    try {
        const submission = await SpeakingSubmission.findById(req.params.id)
            .populate('studentId', 'userId')
            .populate({ path: 'studentId', populate: { path: 'userId', select: 'fullName' } });

        if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

        return res.status(200).json({
            success: true,
            data: {
                student: submission.studentId?.userId?.fullName,
                timestamp: submission.createdAt,
                metrics: {
                    lexicalDiversity: submission.lexicalDiversity,
                    lexicalSophistication: submission.lexicalSophistication,
                    lexicalDensity: submission.lexicalDensity,
                    wordCount: submission.wordCount,
                    uniqueWordCount: submission.uniqueWordCount,
                    advancedWords: submission.advancedWords
                },
                transcription: submission.transcription,
                audioUrl: submission.audioUrl
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all speech assessments for ALL students (not just assigned)
 * GET /api/teachers/assessments
 */
const getSpeechAssessments = async (req, res, next) => {
    try {
        console.log('📊 Fetching all speech assessments for teacher...');
        
        // Fetch ALL assessments from ALL students
        const assessments = await SpeakingSubmission.find({})
            .select('-audioUrl -transcription') // Exclude heavy fields
            .populate({
                path: 'studentId',
                select: 'userId',
                populate: { path: 'userId', select: 'fullName email profilePicture' }
            })
            .sort({ createdAt: -1 })
            .limit(100) // Limit to recent 100 assessments
            .lean();

        console.log(`✅ Found ${assessments.length} assessments`);

        return successResponse(res, 200, 'Assessments retrieved', assessments);
    } catch (error) {
        console.error('❌ Error fetching assessments:', error);
        next(error);
    }
};

/**
 * Get speech assessment detail
 * GET /api/teachers/assessments/:id
 */
const getSpeechAssessmentDetail = async (req, res, next) => {
    try {
        const assessment = await SpeakingSubmission.findById(req.params.id)
            .populate({
                path: 'studentId',
                populate: { path: 'userId', select: 'fullName email profilePicture' }
            })
            .populate('conversationId')
            .lean();

        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        return successResponse(res, 200, 'Assessment detail retrieved', assessment);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboard,
    getProfile,
    getStudents,
    getStudentDetail,
    getStudentProgress,
    getModules,
    getPayments,
    getAnalytics,
    getInitData,
    exportSpeakingScores,
    exportAiReport,
    getSpeechAssessments,
    getSpeechAssessmentDetail
};
