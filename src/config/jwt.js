const jwt = require('jsonwebtoken');

const jwtConfig = {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTokenExpire: process.env.JWT_EXPIRE || '15m',
    refreshTokenExpire: process.env.JWT_REFRESH_EXPIRE || '7d'
};

const generateAccessToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role },
        jwtConfig.secret,
        { expiresIn: jwtConfig.accessTokenExpire }
    );
};

const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        jwtConfig.refreshSecret,
        { expiresIn: jwtConfig.refreshTokenExpire }
    );
};

const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.secret);
    } catch (error) {
        throw new Error('Invalid or expired access token');
    }
};

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.refreshSecret);
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

const generateTokens = (userId, role) => {
    return {
        accessToken: generateAccessToken(userId, role),
        refreshToken: generateRefreshToken(userId)
    };
};

const verifyToken = (token, isRefreshToken = false) => {
    return isRefreshToken ? verifyRefreshToken(token) : verifyAccessToken(token);
};

module.exports = {
    jwtConfig,
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken,
    verifyToken
};
