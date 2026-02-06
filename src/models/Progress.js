const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true
    },
    lessonsCompleted: [{
        lessonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson',
            required: true
        },
        completedAt: {
            type: Date,
            default: Date.now
        },
        timeSpent: {
            type: Number,
            default: 0,
            min: 0
        },
        score: {
            type: Number,
            min: 0,
            max: 100
        }
    }],
    overallProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    totalTimeSpent: {
        type: Number,
        default: 0,
        min: 0
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed'],
        default: 'not_started'
    },
    startedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Compound unique index
progressSchema.index({ studentId: 1, moduleId: 1 }, { unique: true });
progressSchema.index({ studentId: 1 });
progressSchema.index({ status: 1 });

// Method to mark lesson as complete
progressSchema.methods.completeLesson = function (lessonId, timeSpent = 0, score = null) {
    const existing = this.lessonsCompleted.find(
        lc => lc.lessonId.toString() === lessonId.toString()
    );

    if (!existing) {
        this.lessonsCompleted.push({
            lessonId,
            completedAt: new Date(),
            timeSpent,
            score
        });
        this.totalTimeSpent += timeSpent;

        if (this.status === 'not_started') {
            this.status = 'in_progress';
            this.startedAt = new Date();
        }
    }

    this.lastAccessedAt = new Date();
};

// Method to calculate progress percentage
progressSchema.methods.calculateProgress = async function () {
    const Module = mongoose.model('Module');
    const module = await Module.findById(this.moduleId).populate('lessons');

    if (!module || !module.lessons || module.lessons.length === 0) {
        this.overallProgress = 0;
        return 0;
    }

    const totalLessons = module.lessons.length;
    const completedLessons = this.lessonsCompleted.length;

    this.overallProgress = Math.round((completedLessons / totalLessons) * 100);

    if (this.overallProgress === 100 && this.status !== 'completed') {
        this.status = 'completed';
        this.completedAt = new Date();
    }

    return this.overallProgress;
};

const Progress = mongoose.model('Progress', progressSchema);

module.exports = Progress;
