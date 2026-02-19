const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');
const validate = require('../middleware/validation');
const {
    createModuleValidation,
    createLessonValidation,
    createResourceValidation,
    createVideoValidation
} = require('../utils/validators');

const adminMiddleware = require('../middleware/adminMiddleware');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(adminMiddleware);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/reset-password', adminController.resetUserPassword);
router.patch('/users/:id/suspend', adminController.suspendUser);
router.patch('/users/:id/activate', adminController.activateUser);

// Student Management
router.get('/students', adminController.getAllStudents);
router.patch('/students/:id/payment-status', adminController.updateStudentPaymentStatus);

// Teacher Management
router.get('/teachers', adminController.getAllTeachers);
router.post('/teachers', adminController.createTeacher);

// Module Management
router.post('/modules', validate(createModuleValidation), adminController.createModule);
router.put('/modules/:id', adminController.updateModule);
router.delete('/modules/:id', adminController.deleteModule);

// Lesson Management
router.post('/lessons', validate(createLessonValidation), adminController.createLesson);
router.put('/lessons/:id', adminController.updateLesson);
router.delete('/lessons/:id', adminController.deleteLesson);

// Resource Management
router.post('/resources', validate(createResourceValidation), adminController.createResource);
router.put('/resources/:id', adminController.updateResource);
router.delete('/resources/:id', adminController.deleteResource);
router.get('/resources', adminController.getAllResources);

// Video Management
router.post('/videos', validate(createVideoValidation), adminController.createVideo);
router.put('/videos/:id', adminController.updateVideo);
router.delete('/videos/:id', adminController.deleteVideo);
router.get('/videos', adminController.getAllVideos);

// Statistics & System health
router.get('/statistics/overview', adminController.getPlatformStatistics);
router.get('/system/health', adminController.getSystemHealth);
router.get('/system/logs', adminController.getSystemLogs);
router.get('/export-financial-report', adminController.exportFinancialReport);
router.get('/export-faculty-report', adminController.exportFacultyReport);

// Payments
router.get('/payments', adminController.getAllPayments);

// Messages Management
router.get('/messages', adminController.getAllMessages);
router.delete('/messages/:id', adminController.deleteMessage);
router.patch('/messages/:id/read', adminController.markMessageAsRead);

module.exports = router;
