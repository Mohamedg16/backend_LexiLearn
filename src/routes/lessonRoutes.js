const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');

// All lesson routes require authentication
router.use(authenticate);

// Read access (All authenticated users)
router.get('/', lessonController.getAllLessons);
router.get('/:id', lessonController.getLessonById);
router.get('/:id/resources', lessonController.getLessonResources);

// Protected write routes (Teacher & Admin only)
const writeAuth = authorize('teacher', 'admin');
router.post('/', writeAuth, lessonController.createLesson);
router.put('/:id', writeAuth, lessonController.updateLesson);
router.delete('/:id', writeAuth, lessonController.deleteLesson);

module.exports = router;
