const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/User');
require('dotenv').config();

const createAdminAccount = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'coderise.team@gmail.com' });
        
        if (existingAdmin) {
            console.log('⚠️  Admin account already exists');
            console.log('📧 Email:', existingAdmin.email);
            console.log('👤 Role:', existingAdmin.role);
            
            // Update password if needed
            const hashedPassword = await bcrypt.hash('Lexilearn.2026', 10);
            existingAdmin.password = hashedPassword;
            existingAdmin.role = 'admin';
            existingAdmin.isVerified = true;
            await existingAdmin.save();
            console.log('✅ Admin password updated');
        } else {
            // Create new admin account
            const hashedPassword = await bcrypt.hash('Lexilearn.2026', 10);
            
            const adminUser = new User({
                fullName: 'CodeRise Team',
                email: 'coderise.team@gmail.com',
                password: hashedPassword,
                role: 'admin',
                isVerified: true,
                profilePicture: 'https://ui-avatars.com/api/?name=CodeRise+Team&background=6366f1&color=fff'
            });

            await adminUser.save();
            console.log('✅ Admin account created successfully!');
            console.log('📧 Email: coderise.team@gmail.com');
            console.log('🔑 Password: Lexilearn.2026');
            console.log('👤 Role: admin');
        }

        console.log('\n🎉 Admin account is ready!');
        console.log('🔗 Login at: https://lexilearn-lige.onrender.com/auth');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

createAdminAccount();
