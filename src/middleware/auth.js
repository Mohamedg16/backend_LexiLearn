const { verifyAccessToken } = require('../config/jwt');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = verifyAccessToken(token);

        // Get user from database
        const user = await User.findById(decoded.id).select('-password -refreshToken');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Token invalid.'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is suspended. Contact administrator.'
            });
        }

        // Attach user to request
        req.user = user;
        next();

    } catch (error) {
        if (error.message.includes('expired')) {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please refresh your token.',
                code: 'TOKEN_EXPIRED'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid token. Authentication failed.'
        });
    }
};

module.exports = authenticate;
