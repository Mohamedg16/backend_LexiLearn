const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask } = require('../controllers/taskController');

// Using flexible routes for now to ensure 404 is resolved
router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTask);

module.exports = router;
