const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');

// All student routes require authentication and student role
router.use(authenticate);
router.use(authorize('student'));

// Dashboard and profile
router.get('/dashboard', studentController.getDashboard);
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);

// Module enrollment
router.post('/modules/:id/enroll', studentController.enrollInModule);
router.get('/my-modules', studentController.getEnrolledModules);

// Progress tracking
router.get('/progress/:moduleId', studentController.getModuleProgress);
router.post('/progress/lesson-complete', studentController.markLessonComplete);

// Statistics
router.get('/statistics', studentController.getStatistics);
router.get('/speaking-history', studentController.getSpeakingHistory);
router.get('/speaking-history/:id', studentController.getSpeakingHistoryDetail);
router.delete('/speaking-history/:id', studentController.deleteSpeakingHistory);
router.get('/ai-history', studentController.getAIHistory);
router.get('/videos', studentController.getAllVideos);

module.exports = router;
