const express = require('express');
const router = express.Router();
const aiChatController = require('../controllers/aiChatController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');
const validate = require('../middleware/validation');
const { chatMessageValidation } = require('../utils/validators');

// All AI chat routes require authentication and student role
// All AI chat routes require authentication
router.use(authenticate);

// Student routes
router.post('/send', authorize('student'), aiChatController.sendMessage);
router.get('/conversations', authorize('student'), aiChatController.getConversations);

// Shared/Admin/Teacher routes
router.get('/all-conversations', authorize('teacher', 'admin'), aiChatController.getAllStudentConversations);
router.get('/conversations/:id', authorize('student', 'teacher', 'admin'), aiChatController.getConversationById);
router.delete('/conversations/:id', authorize('student', 'admin'), aiChatController.deleteConversation);

module.exports = router;
