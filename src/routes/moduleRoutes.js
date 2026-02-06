const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');

// Public routes (no authentication required)
router.get('/', moduleController.getAllModules); // Featured lessons on homepage
router.get('/:id', moduleController.getModuleById); // View module details
router.get('/:id/lessons', moduleController.getModuleLessons); // View lessons in a module

// Protected routes (require authentication)
router.get('/category/:category', authenticate, moduleController.getModulesByCategory);
router.get('/level/:level', authenticate, moduleController.getModulesByLevel);

module.exports = router;
