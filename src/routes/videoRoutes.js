const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');

// Public read access
router.get('/', videoController.getAllVideos);
router.get('/:id', videoController.getVideoById);
router.get('/category/:category', videoController.getVideosByCategory);

// All other routes require authentication
router.use(authenticate);
router.use(authorize('student', 'teacher', 'admin'));

module.exports = router;
