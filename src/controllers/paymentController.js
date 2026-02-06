const Payment = require('../models/Payment');
const Student = require('../models/Student');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Get payment history for the logged-in user
 * GET /api/payments/history
 */
const getPaymentHistory = async (req, res, next) => {
    try {
        const payments = await Payment.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        return successResponse(res, 200, 'Payment history retrieved', payments);
    } catch (error) {
        next(error);
    }
};

/**
 * Process a simulated subscription payment
 * POST /api/payments/subscribe
 */
const processSubscription = async (req, res, next) => {
    try {
        const { amount, paymentMethod } = req.body;

        if (req.user.role !== 'student') {
            return errorResponse(res, 403, 'Only students can subscribe');
        }

        // Create payment record
        const payment = await Payment.create({
            userId: req.user._id,
            userRole: 'student',
            amount: amount || 29.99, // Default monthly rate
            type: 'subscription',
            status: 'paid',
            paymentMethod: paymentMethod || 'Credit Card (Simulated)',
            paidAt: new Date(),
            notes: 'Monthly research access fee'
        });

        // Update student status
        const student = await Student.findOneAndUpdate(
            { userId: req.user._id },
            {
                monthlyPaymentStatus: 'paid',
                $push: { paymentHistory: payment._id } // Assuming we might want to store it there too
            },
            { new: true }
        );

        return successResponse(res, 201, 'Subscription active', {
            payment,
            studentStatus: student?.monthlyPaymentStatus
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPaymentHistory,
    processSubscription
};
