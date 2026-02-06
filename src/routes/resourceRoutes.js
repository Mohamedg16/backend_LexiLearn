const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');

// Public read routes
router.get('/', resourceController.getAllResources);
router.get('/:id', resourceController.getResourceById);

// Protected write routes
router.use(authenticate);
router.use(authorize('student', 'teacher', 'admin'));

// (Teacher & Admin only)
const writeAuth = authorize('teacher', 'admin');
router.post('/', writeAuth, resourceController.createResource);
router.delete('/:id', writeAuth, resourceController.deleteResource);

module.exports = router;
