const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/helpers');
const { verifyToken } = require('../config/jwt');

/**
 * Register new user
 */
const register = async (req, res, next) => {
    try {
        const result = await authService.registerUser(req.body);

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: true, // Always secure for sameSite 'none'
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return successResponse(res, 201, 'Registration successful.', {
            user: result.user,
            accessToken: result.accessToken
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verify OTP for Registration
 * POST /api/auth/verify-otp
 */
const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const result = await authService.verifyOtp(email, otp);

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: true, // Always secure for sameSite 'none'
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return successResponse(res, 200, 'Account verified successfully.', {
            user: result.user,
            accessToken: result.accessToken
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: true, // Always secure for sameSite 'none'
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return successResponse(res, 200, 'Login successful', {
            user: result.user,
            accessToken: result.accessToken
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Forgot Password - Request OTP
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        await authService.forgotPassword(email);
        return successResponse(res, 200, 'Password reset OTP sent to your email.');
    } catch (error) {
        next(error);
    }
};

/**
 * Reset Password with OTP
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        await authService.resetPassword(email, otp, newPassword);
        return successResponse(res, 200, 'Password has been reset successfully.');
    } catch (error) {
        next(error);
    }
};

/**
 * Logout user
 */
const logout = async (req, res, next) => {
    try {
        await authService.logoutUser(req.user._id);
        res.clearCookie('refreshToken');
        return successResponse(res, 200, 'Logout successful', null);
    } catch (error) {
        next(error);
    }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return errorResponse(res, 401, 'Refresh token not found');

        const decoded = verifyToken(refreshToken, true);
        const result = await authService.refreshAccessToken(decoded.id);

        return successResponse(res, 200, 'Token refreshed', result);
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user
 */
const getCurrentUser = async (req, res, next) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.user._id);

        return successResponse(res, 200, 'User retrieved', {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            profilePicture: user.getProfilePictureUrl(),
            isEmailVerified: user.isEmailVerified,
            lastLogin: user.lastLogin
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    verifyOtp,
    login,
    forgotPassword,
    resetPassword,
    logout,
    refreshToken,
    getCurrentUser
};
