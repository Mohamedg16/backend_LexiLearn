const crypto = require('crypto');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { generateTokens, verifyToken } = require('../config/jwt');
const { sendRegistrationOTPEmail, sendOTPEmail } = require('../utils/sendEmail');

/**
 * Strong Password Validation Regex
 * Min 8 chars, 1 uppercase, 1 number, 1 special char
 */
const validatePassword = (password) => {
    // Requires 8+ chars, 1 upper, 1 lower, 1 number, and 1 special character
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    return regex.test(password);
};

/**
 * Register a new user
 */
const registerUser = async (userData) => {
    console.log("1. Registration started for:", userData.email);
    const { fullName, email, password, role, level, assignedModules, hourlyRate } = userData;

    try {
        // 1. Strong Password Policy
        if (!validatePassword(password)) {
            console.log("DEBUG: Password validation failed");
            throw new Error('Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.');
        }

        // 2. Check existence
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("DEBUG: User already exists");
            throw new Error('Email already registered');
        }

        console.log("DEBUG: Creating user in DB...");
        // 4. Create user - Verification disabled (isEmailVerified: true)
        const user = await User.create({
            fullName,
            email,
            password,
            role,
            isEmailVerified: true
        });

        // 5. Create profile
        if (role === 'student') {
            await Student.create({ userId: user._id, level: level || 'A1 Beginner' });
        } else if (role === 'teacher') {
            await Teacher.create({ userId: user._id, assignedModules: assignedModules || [], hourlyRate: hourlyRate || 0 });
        }
        console.log("DEBUG: User and Profile created successfully");

        // 6. Generate tokens for immediate login
        const tokens = generateTokens(user._id, user.role);
        user.lastLogin = new Date();
        user.refreshToken = tokens.refreshToken;
        await user.save();

        console.log(`4. ✅ Registration process finished for ${user.email}.`);
        return {
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                profilePicture: user.getProfilePictureUrl()
            },
            ...tokens
        };
    } catch (error) {
        console.error("❌ Registration Error:", error.message);
        throw error;
    }
};

/**
 * Verify OTP for Registration
 */
const verifyOtp = async (email, otp) => {
    const user = await User.findOne({
        email,
        emailVerificationToken: otp,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new Error('Invalid or expired verification code');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    // Generate tokens automatically after verification
    const tokens = generateTokens(user._id, user.role);
    user.lastLogin = new Date();
    user.refreshToken = tokens.refreshToken;

    await user.save();

    return {
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            profilePicture: user.getProfilePictureUrl()
        },
        ...tokens
    };
};

/**
 * Login user
 */
const loginUser = async (email, password) => {
    const user = await User.findOne({ email }).select('+password');

    if (!user) throw new Error('Invalid email or password');
    if (!user.isActive) throw new Error('Account is suspended.');
    // Check for email verification REMOVED as requested

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) throw new Error('Invalid email or password');

    const tokens = generateTokens(user._id, user.role);
    user.lastLogin = new Date();
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return {
        user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, profilePicture: user.getProfilePictureUrl() },
        ...tokens
    };
};

/**
 * Forgot Password - Send OTP
 */
const forgotPassword = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found with this email');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔑 DEBUG: Generated Password Reset OTP for ${email}: ${otp}`);
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    const emailSent = await sendOTPEmail(user, otp);
    if (!emailSent) {
        console.warn(`⚠️ Email failed for password reset of ${email}, OTP is available in logs.`);
    }
    return true;
};

/**
 * Reset Password with OTP
 */
const resetPassword = async (email, otp, newPassword) => {
    if (!validatePassword(newPassword)) {
        throw new Error('New password must meet security requirements.');
    }

    const user = await User.findOne({
        email,
        resetPasswordOTP: otp,
        resetPasswordOTPExpire: { $gt: Date.now() }
    });

    if (!user) throw new Error('Invalid or expired OTP');

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    await user.save();

    return true;
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (userId) => {
    const user = await User.findById(userId);
    if (!user || !user.isActive) throw new Error('User not found or inactive');

    const { generateAccessToken } = require('../config/jwt');
    const accessToken = generateAccessToken(user._id, user.role);
    return { accessToken };
};

/**
 * Logout user
 */
const logoutUser = async (userId) => {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
};

module.exports = {
    registerUser,
    loginUser,
    verifyOtp,
    forgotPassword,
    resetPassword,
    refreshAccessToken,
    logoutUser
};
