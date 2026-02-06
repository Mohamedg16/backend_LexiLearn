const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            family: 4, // Force IPv4 to avoid DNS timeouts
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error(`❌ MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);

        if (error.message.includes('queryTxt ETIMEOUT')) {
            console.log('\n💡 TIP: This looks like a DNS issue. Try using Google DNS (8.8.8.8) or use the Standard Connection String (starts with "mongodb://" instead of "mongodb+srv://") in your .env file.\n');
        }

        console.log('🔄 Retrying connection in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

module.exports = { connectDB };
