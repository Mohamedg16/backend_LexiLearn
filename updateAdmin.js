const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const userSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    role: String,
    isEmailVerified: Boolean,
    profilePicture: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function updateAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete all existing admins
        await User.deleteMany({ role: 'admin' });
        console.log('Deleted all existing admins');

        // Delete any existing user with this email
        await User.deleteMany({ email: 'coderise.team@gmail.com' });
        console.log('Deleted existing user with this email');

        // Hash the password
        const hashedPassword = await bcrypt.hash('Lexilearn.2026', 10);

        // Create the new admin
        const admin = await User.create({
            fullName: 'LexiLearn Admin',
            email: 'coderise.team@gmail.com',
            password: hashedPassword,
            role: 'admin',
            isEmailVerified: true,
            profilePicture: 'https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff'
        });

        console.log('Admin created successfully:', admin.email);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateAdmin();
