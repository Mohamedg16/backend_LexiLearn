const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    level: {
        type: String,
        enum: [
            'A1 Beginner', 'A2 Elementary',
            'B1 Intermediate', 'B2 Upper Inter',
            'C1 Advanced', 'C2 Mastery'
        ],
        required: true,
        default: 'A1 Beginner'
    },
    enrolledModules: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module'
    }],
    totalStudyHours: {
        type: Number,
        default: 0,
        min: 0
    },
    totalLessonsCompleted: {
        type: Number,
        default: 0,
        min: 0
    },
    currentStreak: {
        type: Number,
        default: 0,
        min: 0
    },
    longestStreak: {
        type: Number,
        default: 0,
        min: 0
    },
    lastStudyDate: {
        type: Date,
        default: null
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'expired', 'pending', 'cancelled'],
        default: 'pending'
    },
    subscriptionPlan: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly'],
        default: null
    },
    subscriptionStartDate: {
        type: Date,
        default: null
    },
    subscriptionEndDate: {
        type: Date,
        default: null
    },
    achievements: [{
        badgeName: {
            type: String,
            required: true
        },
        badgeIcon: String,
        description: String,
        earnedAt: {
            type: Date,
            default: Date.now
        }
    }],
    studyLogs: [{
        date: {
            type: Date,
            required: true
        },
        hours: {
            type: Number,
            required: true,
            min: 0
        },
        lessonsCompleted: {
            type: Number,
            default: 0
        }
    }],
    monthlyPaymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'overdue'],
        default: 'pending'
    },
    lastPaymentDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes
studentSchema.index({ level: 1 });
studentSchema.index({ subscriptionStatus: 1 });
studentSchema.index({ 'studyLogs.date': 1 });

// Method to update streak
studentSchema.methods.updateStreak = function () {
    const today = new Date().setHours(0, 0, 0, 0);
    const lastStudy = this.lastStudyDate ? new Date(this.lastStudyDate).setHours(0, 0, 0, 0) : null;

    if (!lastStudy) {
        this.currentStreak = 1;
    } else {
        const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
            // Same day, don't change streak
            return;
        } else if (daysDiff === 1) {
            // Consecutive day
            this.currentStreak += 1;
        } else {
            // Streak broken
            this.currentStreak = 1;
        }
    }

    if (this.currentStreak > this.longestStreak) {
        this.longestStreak = this.currentStreak;
    }

    this.lastStudyDate = new Date();
};

// Method to add achievement
studentSchema.methods.addAchievement = function (badgeName, badgeIcon, description) {
    const exists = this.achievements.some(a => a.badgeName === badgeName);
    if (!exists) {
        this.achievements.push({ badgeName, badgeIcon, description });
        return true;
    }
    return false;
};

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
