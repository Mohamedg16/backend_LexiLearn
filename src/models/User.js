const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [3, 'Name must be at least 3 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        required: [true, 'Role is required']
    },
    profilePicture: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordOTP: String,
    resetPasswordOTPExpire: Date,
    lastLogin: {
        type: Date,
        default: null
    },
    refreshToken: {
        type: String,
        select: false
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate profile picture URL
userSchema.methods.getProfilePictureUrl = function () {
    if (this.profilePicture) {
        return this.profilePicture;
    }
    // Generate avatar URL using UI Avatars
    const name = encodeURIComponent(this.fullName);
    return `https://ui-avatars.com/api/?name=${name}&background=random`;
};

// Don't return password and sensitive fields
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.refreshToken;
    delete user.emailVerificationToken;
    delete user.passwordResetToken;
    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
