const express = require('express');
const router = express.Router();
const lexilearnController = require('../controllers/lexilearnController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');
const { uploadSingle } = require('../middleware/upload');

// Phase 1: Tutor chat
router.post('/tutor', authenticate, authorize('student'), lexilearnController.chatTutor);

// Phase 2: Transcribe audio
router.post('/transcribe', authenticate, authorize('student'), uploadSingle('audio'), lexilearnController.transcribeAudio);
router.post('/submit-audio', authenticate, authorize('student'), uploadSingle('audio'), lexilearnController.transcribeAudio);

// Phase 3: Analyze speech
router.post('/analyze', authenticate, authorize('student'), lexilearnController.analyzeSpeech);

// Save session
router.post('/save-session', authenticate, authorize('student'), lexilearnController.saveSession);

module.exports = router;
