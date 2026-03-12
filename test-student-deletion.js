/**
 * Test Script for Student Deletion
 * 
 * This script tests the complete student deletion flow including:
 * 1. Creating a test student
 * 2. Adding related data (conversations, progress, etc.)
 * 3. Deleting the student
 * 4. Verifying all data is deleted
 * 5. Verifying login is blocked
 * 
 * Usage: node test-student-deletion.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const Conversation = require('./src/models/Conversation');
const Progress = require('./src/models/Progress');
const Enrollment = require('./src/models/Enrollment');
const AiInteractionLog = require('./src/models/AiInteractionLog');

// Test configuration
const TEST_STUDENT = {
  fullName: 'Test Student Delete',
  email: 'test.delete@student.com',
  password: 'Test@1234',
  role: 'student',
  level: 'A1 Beginner'
};

let testUserId;
let testStudentId;

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Step 1: Create test student
const createTestStudent = async () => {
  console.log('\n📝 Step 1: Creating test student...');
  
  try {
    // Check if already exists
    const existing = await User.findOne({ email: TEST_STUDENT.email });
    if (existing) {
      console.log('⚠️  Test student already exists, cleaning up first...');
      const existingStudent = await Student.findOne({ userId: existing._id });
      if (existingStudent) {
        await Student.findByIdAndDelete(existingStudent._id);
      }
      await User.findByIdAndDelete(existing._id);
    }

    // Create user
    const user = await User.create({
      fullName: TEST_STUDENT.fullName,
      email: TEST_STUDENT.email,
      password: TEST_STUDENT.password,
      role: TEST_STUDENT.role,
      isEmailVerified: true,
      isActive: true
    });

    testUserId = user._id;
    console.log(`✅ User created: ${user.email} (ID: ${testUserId})`);

    // Create student profile
    const student = await Student.create({
      userId: user._id,
      level: TEST_STUDENT.level
    });

    testStudentId = student._id;
    console.log(`✅ Student profile created (ID: ${testStudentId})`);

    return { user, student };
  } catch (error) {
    console.error('❌ Failed to create test student:', error.message);
    throw error;
  }
};

// Step 2: Create related data
const createRelatedData = async () => {
  console.log('\n📝 Step 2: Creating related data...');

  try {
    // Create conversations
    const conversation = await Conversation.create({
      studentId: testStudentId,
      title: 'Test Conversation',
      messages: [
        { role: 'user', content: 'Hello AI' },
        { role: 'assistant', content: 'Hello! How can I help?' }
      ]
    });
    console.log(`✅ Created conversation (ID: ${conversation._id})`);

    // Create AI interaction log
    const aiLog = await AiInteractionLog.create({
      studentId: testStudentId,
      tool: 'vocab_coach',
      requestType: 'synonym',
      userMessage: 'What is a synonym for happy?',
      aiResponse: 'Joyful, cheerful, delighted'
    });
    console.log(`✅ Created AI interaction log (ID: ${aiLog._id})`);

    // Get a module to create progress
    const Module = require('./src/models/Module');
    const module = await Module.findOne();
    
    if (module) {
      // Create progress
      const progress = await Progress.create({
        studentId: testStudentId,
        moduleId: module._id,
        status: 'in_progress',
        overallProgress: 25
      });
      console.log(`✅ Created progress (ID: ${progress._id})`);

      // Create enrollment
      const enrollment = await Enrollment.create({
        studentId: testStudentId,
        moduleId: module._id,
        status: 'active'
      });
      console.log(`✅ Created enrollment (ID: ${enrollment._id})`);
    } else {
      console.log('⚠️  No modules found, skipping progress/enrollment creation');
    }

    console.log('✅ All related data created successfully');
  } catch (error) {
    console.error('❌ Failed to create related data:', error.message);
    throw error;
  }
};

// Step 3: Verify data exists
const verifyDataExists = async () => {
  console.log('\n📝 Step 3: Verifying data exists before deletion...');

  const counts = {
    user: await User.countDocuments({ _id: testUserId }),
    student: await Student.countDocuments({ _id: testStudentId }),
    conversations: await Conversation.countDocuments({ studentId: testStudentId }),
    aiLogs: await AiInteractionLog.countDocuments({ studentId: testStudentId }),
    progress: await Progress.countDocuments({ studentId: testStudentId }),
    enrollments: await Enrollment.countDocuments({ studentId: testStudentId })
  };

  console.log('📊 Data counts before deletion:');
  console.log(`   - Users: ${counts.user}`);
  console.log(`   - Students: ${counts.student}`);
  console.log(`   - Conversations: ${counts.conversations}`);
  console.log(`   - AI Logs: ${counts.aiLogs}`);
  console.log(`   - Progress: ${counts.progress}`);
  console.log(`   - Enrollments: ${counts.enrollments}`);

  return counts;
};

// Step 4: Delete student using the controller logic
const deleteTestStudent = async () => {
  console.log('\n📝 Step 4: Deleting student with cascade...');

  const session = await mongoose.startSession();
  
  try {
    await session.startTransaction();

    const student = await Student.findById(testStudentId).session(session);
    if (!student) {
      throw new Error('Student not found');
    }

    const userId = student.userId;
    const studentId = student._id;

    console.log('🗑️  Starting cascade deletion...');

    // Delete all related data
    const deletionResults = await Promise.allSettled([
      Conversation.deleteMany({ studentId }).session(session),
      AiInteractionLog.deleteMany({ studentId }).session(session),
      Progress.deleteMany({ studentId }).session(session),
      Enrollment.deleteMany({ studentId }).session(session)
    ]);

    const collections = ['Conversations', 'AiInteractionLogs', 'Progress', 'Enrollments'];
    deletionResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`   ✅ Deleted ${result.value.deletedCount} ${collections[index]}`);
      } else {
        console.error(`   ❌ Failed to delete ${collections[index]}:`, result.reason);
      }
    });

    // Delete student document
    await Student.findByIdAndDelete(studentId).session(session);
    console.log('   ✅ Deleted Student document');

    // Delete user document
    await User.findByIdAndDelete(userId).session(session);
    console.log('   ✅ Deleted User document');

    await session.commitTransaction();
    console.log('✅ Transaction committed successfully');

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Deletion failed:', error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

// Step 5: Verify data is deleted
const verifyDataDeleted = async () => {
  console.log('\n📝 Step 5: Verifying data is deleted...');

  const counts = {
    user: await User.countDocuments({ _id: testUserId }),
    student: await Student.countDocuments({ _id: testStudentId }),
    conversations: await Conversation.countDocuments({ studentId: testStudentId }),
    aiLogs: await AiInteractionLog.countDocuments({ studentId: testStudentId }),
    progress: await Progress.countDocuments({ studentId: testStudentId }),
    enrollments: await Enrollment.countDocuments({ studentId: testStudentId })
  };

  console.log('📊 Data counts after deletion:');
  console.log(`   - Users: ${counts.user}`);
  console.log(`   - Students: ${counts.student}`);
  console.log(`   - Conversations: ${counts.conversations}`);
  console.log(`   - AI Logs: ${counts.aiLogs}`);
  console.log(`   - Progress: ${counts.progress}`);
  console.log(`   - Enrollments: ${counts.enrollments}`);

  // Verify all counts are 0
  const allDeleted = Object.values(counts).every(count => count === 0);
  
  if (allDeleted) {
    console.log('✅ All data successfully deleted!');
  } else {
    console.error('❌ Some data still exists!');
    throw new Error('Cascade deletion incomplete');
  }

  return counts;
};

// Step 6: Test login prevention
const testLoginPrevention = async () => {
  console.log('\n📝 Step 6: Testing login prevention...');

  try {
    const authService = require('./src/services/authService');
    await authService.loginUser(TEST_STUDENT.email, TEST_STUDENT.password);
    console.error('❌ Login should have been blocked!');
    throw new Error('Login was not prevented');
  } catch (error) {
    if (error.message.includes('Account no longer exists') || 
        error.message.includes('Invalid email or password')) {
      console.log('✅ Login correctly blocked:', error.message);
    } else {
      console.error('❌ Unexpected error:', error.message);
      throw error;
    }
  }
};

// Main test runner
const runTests = async () => {
  console.log('🧪 Starting Student Deletion Tests\n');
  console.log('='.repeat(60));

  try {
    await connectDB();

    // Run all test steps
    await createTestStudent();
    await createRelatedData();
    const beforeCounts = await verifyDataExists();
    await deleteTestStudent();
    const afterCounts = await verifyDataDeleted();
    await testLoginPrevention();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✅ Summary:');
    console.log('   - Student deletion: SUCCESS');
    console.log('   - Cascade deletion: SUCCESS');
    console.log('   - Login prevention: SUCCESS');
    console.log('   - Data integrity: SUCCESS');

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.error('❌ TESTS FAILED!');
    console.log('='.repeat(60));
    console.error('\nError:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
};

// Run tests
runTests();
