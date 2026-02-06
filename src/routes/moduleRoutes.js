const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');

// All module routes require authentication
router.use(authenticate);

// Read access (All authenticated users)
router.get('/', moduleController.getAllModules);
router.get('/:id', moduleController.getModuleById);
router.get('/:id/lessons', moduleController.getModuleLessons);
router.get('/category/:category', moduleController.getModulesByCategory);
router.get('/level/:level', moduleController.getModulesByLevel);

module.exports = router;
