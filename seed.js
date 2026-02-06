const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const Module = require('./src/models/Module');
const Lesson = require('./src/models/Lesson');

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB for seeding');

        // Clear existing data
        await User.deleteMany({});
        await Module.deleteMany({});
        await Lesson.deleteMany({});
        console.log('🗑️ Cleared existing data');

        // Create admin user
        const adminUser = await User.create({
            fullName: 'Admin User',
            email: 'admin@school.com',
            password: await bcrypt.hash('password123', 10),
            role: 'admin',
            isActive: true
        });

        // Create teacher user
        const teacherUser = await User.create({
            fullName: 'Dr. Sarah Anderson',
            email: 'teacher@school.com',
            password: await bcrypt.hash('password123', 10),
            role: 'teacher',
            subject: 'Mathematics',
            hourlyRate: 50,
            isActive: true
        });

        // Create student users
        const studentUsers = await User.insertMany([
            {
                fullName: 'Alice Johnson',
                email: 'alice@student.com',
                password: await bcrypt.hash('password123', 10),
                role: 'student',
                level: 'beginner',
                isActive: true
            },
            {
                fullName: 'Bob Smith',
                email: 'bob@student.com',
                password: await bcrypt.hash('password123', 10),
                role: 'student',
                level: 'intermediate',
                isActive: true
            },
            {
                fullName: 'Carol Williams',
                email: 'carol@student.com',
                password: await bcrypt.hash('password123', 10),
                role: 'student',
                level: 'beginner',
                isActive: true
            }
        ]);

        // Create modules
        const mathModule = await Module.create({
            title: 'Mathematics',
            description: 'Comprehensive mathematics course',
            level: 'All Levels',
            teacherId: teacherUser._id,
            isActive: true
        });

        // Create lessons
        const lessons = await Lesson.insertMany([
            {
                title: 'Algebra Basics',
                description: 'Introduction to algebraic concepts and equations',
                content: 'This lesson covers the fundamental concepts of algebra including variables, expressions, and basic equation solving.',
                videoUrl: 'https://www.youtube.com/watch?v=example1',
                thumbnailUrl: 'https://via.placeholder.com/400x250?text=Algebra+Basics',
                moduleId: mathModule._id,
                teacherId: teacherUser._id,
                isPublished: true
            },
            {
                title: 'Geometry Fundamentals',
                description: 'Basic geometric shapes and formulas',
                content: 'Learn about points, lines, angles, triangles, and other geometric shapes. Understand area and perimeter calculations.',
                videoUrl: 'https://www.youtube.com/watch?v=example2',
                thumbnailUrl: 'https://via.placeholder.com/400x250?text=Geometry',
                moduleId: mathModule._id,
                teacherId: teacherUser._id,
                isPublished: true
            },
            {
                title: 'Calculus Introduction',
                description: 'Introduction to differential and integral calculus',
                content: 'Explore the concepts of limits, derivatives, and integrals. Learn how calculus applies to real-world problems.',
                videoUrl: 'https://www.youtube.com/watch?v=example3',
                thumbnailUrl: 'https://via.placeholder.com/400x250?text=Calculus',
                moduleId: mathModule._id,
                teacherId: teacherUser._id,
                isPublished: true
            }
        ]);

        console.log('✅ Database seeded successfully!');
        console.log(`👤 Created ${studentUsers.length} students`);
        console.log(`👨‍🏫 Created 1 teacher`);
        console.log(`👑 Created 1 admin`);
        console.log(`📚 Created 1 module`);
        console.log(`📖 Created ${lessons.length} lessons`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();