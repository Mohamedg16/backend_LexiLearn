const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { successResponse } = require('../utils/helpers');

/**
 * Submit a contact form message
 * POST /api/contact
 */
router.post('/', async (req, res, next) => {
    try {
        const { name, email, message } = req.body;

        // Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const newMessage = await Message.create({
            name,
            email,
            message
        });

        return successResponse(res, 201, 'Message sent successfully', newMessage);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
