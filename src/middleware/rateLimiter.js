const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Strict limiter for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 attempts for development
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes'
    }
});

// Limiter for password reset
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts
    message: {
        success: false,
        message: 'Too many password reset attempts, please try again after 1 hour'
    }
});

// Limiter for file uploads
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: {
        success: false,
        message: 'Too many file uploads, please try again later'
    }
});

module.exports = {
    apiLimiter,
    authLimiter,
    passwordResetLimiter,
    uploadLimiter
};
