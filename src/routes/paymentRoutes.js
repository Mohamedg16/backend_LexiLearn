const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middleware/auth');

// All payment routes require authentication
router.use(authenticate);

/**
 * @route GET /api/payments/history
 * @desc Get payment history for the logged-in user
 * @access Private
 */
router.get('/history', paymentController.getPaymentHistory);

/**
 * @route POST /api/payments/subscribe
 * @desc Process a simulated subscription payment
 * @access Private (Student only)
 */
router.post('/subscribe', paymentController.processSubscription);

module.exports = router;
