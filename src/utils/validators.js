const Joi = require('joi');

// User Registration Validation
const registerValidation = Joi.object({
    fullName: Joi.string().min(3).max(50).required().messages({
        'string.min': 'Full name must be at least 3 characters',
        'string.max': 'Full name cannot exceed 50 characters',
        'any.required': 'Full name is required'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email',
        'any.required': 'Email is required'
    }),
    password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            'any.required': 'Password is required'
        }),
    role: Joi.string().valid('student', 'teacher').required().messages({
        'any.only': 'Role must be either student or teacher',
        'any.required': 'Role is required'
    }),
    level: Joi.when('role', {
        is: 'student',
        then: Joi.string().valid('A1 Beginner', 'A2 Elementary', 'B1 Intermediate', 'B2 Upper Inter', 'C1 Advanced', 'C2 Mastery').required(),
        otherwise: Joi.forbidden()
    }),
    assignedModules: Joi.when('role', {
        is: 'teacher',
        then: Joi.array().items(Joi.string()),
        otherwise: Joi.forbidden()
    }),
    hourlyRate: Joi.when('role', {
        is: 'teacher',
        then: Joi.number().min(0).required(),
        otherwise: Joi.forbidden()
    })
});

// Login Validation
const loginValidation = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Update Profile Validation
const updateProfileValidation = Joi.object({
    fullName: Joi.string().min(3).max(50),
    email: Joi.string().email(),
    profilePicture: Joi.string().uri()
});

// Module Creation Validation
const createModuleValidation = Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000).required(),
    thumbnail: Joi.string().uri(),
    category: Joi.string().required(),
    level: Joi.string().valid('A1 Beginner', 'A2 Elementary', 'B1 Intermediate', 'B2 Upper Inter', 'C1 Advanced', 'C2 Mastery').required(),
    assignedTeacher: Joi.string()
});

// Lesson Creation Validation
const createLessonValidation = Joi.object({
    moduleId: Joi.string().allow('', null),
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000).allow('', null),
    content: Joi.string().max(50000).allow('', null),
    order: Joi.number().min(1),
    duration: Joi.number().min(0),
    videoUrl: Joi.string().allow('', null)
});

// Resource Creation Validation
const createResourceValidation = Joi.object({
    lessonId: Joi.string().allow('', null),
    title: Joi.string().min(3).max(200).required(),
    type: Joi.string().valid('pdf', 'document', 'link', 'image').required(),
    url: Joi.string().required(),
    fileSize: Joi.number().min(0)
});

// Video Creation Validation
const createVideoValidation = Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000),
    youtubeUrl: Joi.string().uri().required(),
    thumbnail: Joi.string().uri(),
    duration: Joi.string(),
    category: Joi.string().required(),
    tags: Joi.array().items(Joi.string())
});

// AI Chat Message Validation
const chatMessageValidation = Joi.object({
    message: Joi.string().min(1).max(10000).required(),
    conversationId: Joi.string()
});

// Password Reset Validation
const resetPasswordValidation = Joi.object({
    password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/)
        .required()
});

module.exports = {
    registerValidation,
    loginValidation,
    updateProfileValidation,
    createModuleValidation,
    createLessonValidation,
    createResourceValidation,
    createVideoValidation,
    chatMessageValidation,
    resetPasswordValidation
};
