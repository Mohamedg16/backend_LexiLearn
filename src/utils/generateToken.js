const jwt = require('jsonwebtoken');

/**
 * Generate JWT access token
 * @param {String} userId - User ID
 * @param {String} role - User role
 * @returns {String} JWT token
 */
const generateAccessToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );
};

/**
 * Generate JWT refresh token
 * @param {String} userId - User ID
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
};

/**
 * Generate both access and refresh tokens
 * @param {String} userId - User ID
 * @param {String} role - User role
 * @returns {Object} Object containing accessToken and refreshToken
 */
const generateTokens = (userId, role) => {
    return {
        accessToken: generateAccessToken(userId, role),
        refreshToken: generateRefreshToken(userId)
    };
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @param {Boolean} isRefreshToken - Whether this is a refresh token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token, isRefreshToken = false) => {
    const secret = isRefreshToken ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
    return jwt.verify(token, secret);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    verifyToken
};
