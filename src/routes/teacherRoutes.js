const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');

// All teacher routes require authentication and teacher role
router.use(authenticate);
router.use(authorize('teacher'));

// Dashboard and profile
router.get('/dashboard', teacherController.getDashboard);
router.get('/init', teacherController.getInitData);
router.get('/profile', teacherController.getProfile);

// Student management
router.get('/students', teacherController.getStudents);
router.get('/students/:id', teacherController.getStudentDetail);
router.get('/students/:id/progress', teacherController.getStudentProgress);

// Modules
router.get('/modules', teacherController.getModules);

// Payments
router.get('/payments', teacherController.getPayments);

// Assessments
router.get('/assessments', teacherController.getSpeechAssessments);

// Analytics
router.get('/analytics', teacherController.getAnalytics);

// Exports
router.get('/export/scores/:taskId', teacherController.exportSpeakingScores);
router.get('/export/ai-report/:id', teacherController.exportAiReport);

module.exports = router;
