// Quick test script to create sample messages
// Run with: node backend/src/scripts/createSampleMessages.js

require('dotenv').config({ path: require('path').join(__dirname, '../../../backend/.env') });
const mongoose = require('mongoose');
const path = require('path');
const Message = require(path.join(__dirname, '../models/Message'));

const sampleMessages = [
    {
        name: 'John Doe',
        email: 'john.doe@example.com',
        message: 'Hello! I am interested in learning more about your English courses. Could you provide more information about the curriculum and pricing?',
        isRead: false
    },
    {
        name: 'Sarah Johnson',
        email: 'sarah.j@gmail.com',
        message: 'I have a question about the speaking assessment feature. How does the AI analyze pronunciation and fluency?',
        isRead: false
    },
    {
        name: 'Michael Chen',
        email: 'mchen@outlook.com',
        message: 'Great platform! I would like to schedule a demo session with one of your teachers. What are the available time slots?',
        isRead: true
    }
];

async function createSampleMessages() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing messages (optional)
        await Message.deleteMany({});
        console.log('🗑️  Cleared existing messages');

        // Create sample messages
        const created = await Message.insertMany(sampleMessages);
        console.log(`✅ Created ${created.length} sample messages`);

        console.log('\nSample messages:');
        created.forEach((msg, index) => {
            console.log(`${index + 1}. ${msg.name} (${msg.email}) - ${msg.isRead ? 'Read' : 'Unread'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createSampleMessages();
