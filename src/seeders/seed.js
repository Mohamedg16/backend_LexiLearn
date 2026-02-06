require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import models
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Resource = require('../models/Resource');
const Video = require('../models/Video');
const Progress = require('../models/Progress');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const Task = require('../models/Task');
const SpeakingSubmission = require('../models/SpeakingSubmission');
const AiInteractionLog = require('../models/AiInteractionLog');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Clear all collections
const clearDatabase = async () => {
    console.log('🗑️  Clearing database...');
    await User.deleteMany({});
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Module.deleteMany({});
    await Lesson.deleteMany({});
    await Resource.deleteMany({});
    await Video.deleteMany({});
    await Progress.deleteMany({});
    await Enrollment.deleteMany({});
    await Payment.deleteMany({});
    await Conversation.deleteMany({});
    await Notification.deleteMany({});
    await Task.deleteMany({});
    await SpeakingSubmission.deleteMany({});
    await AiInteractionLog.deleteMany({});
    console.log('✅ Database cleared');
};

// Seed data
const seedData = async () => {
    try {
        await connectDB();
        await clearDatabase();

        console.log('🌱 Seeding data...\n');

        // 1. Create Admin
        console.log('Creating admin...');
        const adminUser = await User.create({
            fullName: 'Admin User',
            email: 'admin@platform.com',
            password: 'Admin123!',
            role: 'admin',
            isActive: true,
            isEmailVerified: true
        });
        console.log('✅ Admin created: admin@platform.com / Admin123!');

        // 2. Create Teachers
        console.log('\nCreating teachers...');
        const teacherUsers = [];
        const teachers = [];

        const teacherData = [
            { name: 'Dr. Sarah Johnson', email: 'sarah@platform.com', hourlyRate: 50 },
            { name: 'Prof. Michael Chen', email: 'michael@platform.com', hourlyRate: 45 },
            { name: 'Dr. Emily Rodriguez', email: 'emily@platform.com', hourlyRate: 55 }
        ];

        for (const data of teacherData) {
            const user = await User.create({
                fullName: data.name,
                email: data.email,
                password: 'Teacher123!',
                role: 'teacher',
                isActive: true,
                isEmailVerified: true
            });
            teacherUsers.push(user);

            const teacher = await Teacher.create({
                userId: user._id,
                assignedModules: [],
                hourlyRate: data.hourlyRate,
                totalTeachingHours: Math.floor(Math.random() * 100) + 50,
                totalEarnings: 0,
                pendingPayment: 0
            });
            teachers.push(teacher);
            console.log(`✅ Teacher created: ${data.email} / Teacher123!`);
        }

        // 3. Create Modules
        console.log('\nCreating modules...');
        const modules = [];

        const moduleData = [
            {
                title: 'Foundations of Phonology',
                description: 'Master the English rhythm, intonation, and vowel clusters.',
                category: 'Phonetics Hub',
                level: 'A1 Beginner',
                teacher: 0
            },
            {
                title: 'Lexical Expansion: Academic Writing',
                description: 'Build a high-level vocabulary for research and academic contexts.',
                category: 'Lexical Expansion',
                level: 'B1 Intermediate',
                teacher: 1
            },
            {
                title: 'Syntactic Precision',
                description: 'Deep dive into complex sentence structures and grammatical nuances.',
                category: 'Grammar Core',
                level: 'B1 Intermediate',
                teacher: 1
            },
            {
                title: 'Business Discourse & Rhetoric',
                description: 'Professional communication strategies for global leadership.',
                category: 'Strategic Communication',
                level: 'C1 Advanced',
                teacher: 2
            }
        ];

        for (const data of moduleData) {
            const module = await Module.create({
                title: data.title,
                description: data.description,
                category: data.category,
                level: data.level,
                assignedTeacher: teacherUsers[data.teacher]._id,
                isPublished: true,
                createdBy: adminUser._id,
                enrolledStudentsCount: 0,
                lessons: []
            });
            modules.push(module);

            // Update teacher's assigned modules
            await Teacher.findByIdAndUpdate(teachers[data.teacher]._id, {
                $push: { assignedModules: module._id }
            });

            console.log(`✅ Module created: ${data.title}`);
        }

        // 4. Create Lessons for each module
        console.log('\nCreating lessons...');
        const lessons = [];

        for (let i = 0; i < modules.length; i++) {
            const module = modules[i];
            const moduleLessons = [];

            for (let j = 1; j <= 5; j++) {
                const lesson = await Lesson.create({
                    moduleId: module._id,
                    title: `${module.title} - Unit ${j}`,
                    description: `Unit ${j} research materials for ${module.title}`,
                    content: `Comprehensive linguistic analysis for ${module.title}. This unit focuses on mastery through cognitive repetition and feedback.`,
                    order: j,
                    duration: Math.floor(Math.random() * 30) + 15,
                    isPublished: true,
                    resources: []
                });
                moduleLessons.push(lesson._id);
                lessons.push(lesson);
            }

            // Update module with lessons
            await Module.findByIdAndUpdate(module._id, {
                lessons: moduleLessons,
                totalDuration: moduleLessons.length * 30
            });
        }
        console.log(`✅ Created ${lessons.length} lessons`);

        // 5. Create Resources
        console.log('\nCreating resources...');
        let resourceCount = 0;

        for (const lesson of lessons) {
            const resourceTypes = ['pdf', 'document', 'link'];
            const numResources = Math.floor(Math.random() * 3) + 1;

            for (let i = 0; i < numResources; i++) {
                await Resource.create({
                    lessonId: lesson._id,
                    title: `Linguistic Resource ${i + 1} - ${lesson.title}`,
                    type: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
                    url: `https://example.com/resources/${lesson._id}-${i}.pdf`,
                    fileSize: Math.floor(Math.random() * 5000000) + 100000
                });
                resourceCount++;
            }
        }
        console.log(`✅ Created ${resourceCount} resources`);

        // 6. Create Videos
        console.log('\nCreating videos...');
        const videoCategories = ['Phonetics', 'Grammar', 'Vocabulary'];

        for (let i = 0; i < 20; i++) {
            await Video.create({
                title: `Cognitive Lecture ${i + 1}`,
                description: `English Language Research Tutorial ${i + 1}`,
                youtubeUrl: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
                category: videoCategories[Math.floor(Math.random() * videoCategories.length)],
                tags: ['research', 'linguistics', 'fluency'],
                duration: `${Math.floor(Math.random() * 30) + 5}:${Math.floor(Math.random() * 60)}`,
                views: Math.floor(Math.random() * 1000)
            });
        }
        console.log('✅ Created 20 videos');

        // 7. Create Students
        console.log('\nCreating students...');
        const students = [];
        const studentUsers = [];

        const levels = ['A1 Beginner', 'A2 Elementary', 'B1 Intermediate', 'B2 Upper Inter', 'C1 Advanced', 'C2 Mastery'];

        for (let i = 1; i <= 10; i++) {
            const user = await User.create({
                fullName: `Candidate ${i}`,
                email: `student${i}@platform.com`,
                password: 'Student123!',
                role: 'student',
                isActive: true,
                isEmailVerified: true
            });
            studentUsers.push(user);

            const student = await Student.create({
                userId: user._id,
                level: levels[Math.floor(Math.random() * levels.length)],
                enrolledModules: [],
                totalStudyHours: Math.floor(Math.random() * 50),
                totalLessonsCompleted: Math.floor(Math.random() * 20),
                currentStreak: Math.floor(Math.random() * 10),
                subscriptionStatus: 'active',
                subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                monthlyPaymentStatus: i % 2 === 0 ? 'paid' : 'pending'
            });
            students.push(student);
            console.log(`✅ Student created: student${i}@platform.com / Student123!`);
        }

        // 8. Create Enrollments and Progress
        console.log('\nCreating enrollments and progress...');

        for (const student of students) {
            // Enroll each student in 2-4 random modules
            const numEnrollments = Math.floor(Math.random() * 3) + 2;
            const enrolledModules = [];

            for (let i = 0; i < numEnrollments; i++) {
                const randomModule = modules[Math.floor(Math.random() * modules.length)];

                // Check if already enrolled
                if (enrolledModules.includes(randomModule._id.toString())) continue;

                enrolledModules.push(randomModule._id.toString());

                await Enrollment.create({
                    studentId: student._id,
                    moduleId: randomModule._id,
                    status: 'active'
                });

                // Create progress
                const moduleLessons = await Lesson.find({ moduleId: randomModule._id });
                const completedCount = Math.floor(Math.random() * moduleLessons.length);
                const completedLessons = [];

                for (let j = 0; j < completedCount; j++) {
                    completedLessons.push({
                        lessonId: moduleLessons[j]._id,
                        completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                        timeSpent: Math.floor(Math.random() * 60) + 10
                    });
                }

                await Progress.create({
                    studentId: student._id,
                    moduleId: randomModule._id,
                    lessonsCompleted: completedLessons,
                    overallProgress: Math.round((completedCount / moduleLessons.length) * 100),
                    totalTimeSpent: completedLessons.reduce((sum, l) => sum + l.timeSpent, 0),
                    status: completedCount === 0 ? 'not_started' : completedCount === moduleLessons.length ? 'completed' : 'in_progress'
                });

                // Update module enrollment count
                await Module.findByIdAndUpdate(randomModule._id, {
                    $inc: { enrolledStudentsCount: 1 }
                });
            }

            // Update student's enrolled modules
            await Student.findByIdAndUpdate(student._id, {
                enrolledModules
            });
        }
        console.log('✅ Enrollments and progress created');

        // 9. Create Payments
        console.log('\nCreating payments...');

        // Student subscription payments
        for (let i = 0; i < 15; i++) {
            const randomStudent = studentUsers[Math.floor(Math.random() * studentUsers.length)];
            const statuses = ['paid', 'pending', 'overdue'];

            await Payment.create({
                userId: randomStudent._id,
                userRole: 'student',
                amount: 29.99,
                type: 'subscription',
                status: statuses[Math.floor(Math.random() * statuses.length)],
                paymentMethod: 'Credit Card',
                dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
                paidAt: Math.random() > 0.5 ? new Date() : null
            });
        }

        // Teacher payments
        for (const teacher of teachers) {
            await Payment.create({
                userId: teacher.userId,
                userRole: 'teacher',
                amount: teacher.totalTeachingHours * (await Teacher.findById(teacher._id)).hourlyRate,
                type: 'teacher_payment',
                status: 'paid',
                paymentMethod: 'Bank Transfer',
                paidAt: new Date()
            });
        }
        console.log('✅ Payments created');

        // 10. Create Notifications
        console.log('\nCreating notifications...');

        for (const user of [...studentUsers, ...teacherUsers]) {
            const notificationTypes = ['info', 'success', 'warning', 'achievement'];
            const numNotifications = Math.floor(Math.random() * 5) + 1;

            for (let i = 0; i < numNotifications; i++) {
                await Notification.create({
                    userId: user._id,
                    type: notificationTypes[Math.floor(Math.random() * notificationTypes.length)],
                    title: `Notification ${i + 1}`,
                    message: `This is a sample notification message for ${user.fullName}`,
                    isRead: Math.random() > 0.5
                });
            }
        }
        console.log('✅ Notifications created');

        // 11. Create AI Conversations
        console.log('\nCreating AI conversations...');

        for (let i = 0; i < 5; i++) {
            const randomStudent = students[Math.floor(Math.random() * students.length)];

            await Conversation.create({
                studentId: randomStudent._id,
                title: `Conversation about programming ${i + 1}`,
                messages: [
                    {
                        role: 'user',
                        content: 'Can you explain what a variable is in programming?',
                        timestamp: new Date()
                    },
                    {
                        role: 'assistant',
                        content: 'A variable is a container that stores data values. Think of it like a labeled box where you can put information and retrieve it later.',
                        timestamp: new Date()
                    }
                ]
            });
        }
        console.log('✅ AI conversations created');

        // 12. Create Speaking Tasks
        console.log('\nCreating speaking tasks...');
        const speakingTasks = [
            {
                title: 'Introduction - Pre-test',
                description: 'Initial assessment of speaking level.',
                prompt: 'Please introduce yourself and explain why you want to improve your English speaking skills. What are your main goals for this semester?',
                timeLimit: 120,
                planningTimeLimit: 180,
                targetVocabulary: ['background', 'achievement', 'fluency', 'curriculum', 'perspective'],
                timePoint: 'pretest'
            },
            {
                title: 'Urban Life vs Rural Life',
                description: 'Comparing environments and lifestyles.',
                prompt: 'Some people prefer living in big cities, while others prefer the countryside. Compare the advantages and disadvantages of both. Which one do you prefer and why?',
                timeLimit: 180,
                planningTimeLimit: 300,
                targetVocabulary: ['infrastructure', 'tranquility', 'commute', 'pollution', 'convenience'],
                timePoint: 'week2'
            },
            {
                title: 'Future of Education',
                description: 'Discussing AI and online learning.',
                prompt: 'How do you think technology and AI will change the way we learn in the next 10 years? Will regular schools still exist?',
                timeLimit: 180,
                planningTimeLimit: 300,
                targetVocabulary: ['transformation', 'engagement', 'personalized', 'accessibility', 'collaborative'],
                timePoint: 'posttest'
            }
        ];

        for (const taskData of speakingTasks) {
            await Task.create(taskData);
            console.log(`✅ Speaking Task created: ${taskData.title}`);
        }

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📝 Login Credentials:');
        console.log('Admin: admin@platform.com / Admin123!');
        console.log('Teachers: sarah@platform.com, michael@platform.com, emily@platform.com / Teacher123!');
        console.log('Students: student1@platform.com to student10@platform.com / Student123!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

// Run seeder
seedData();
