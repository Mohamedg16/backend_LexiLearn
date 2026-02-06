require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const adminRoutes = require('./routes/adminRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const videoRoutes = require('./routes/videoRoutes');
const aiChatRoutes = require('./routes/aiChatRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const lexilearnRoutes = require('./routes/lexilearnRoutes');
const contactRoutes = require('./routes/contactRoutes');


const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://lexilearn-lige.onrender.com',
    process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Test endpoint to verify API routing
app.get('/api/test', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API routing is working!',
        environment: process.env.NODE_ENV,
        availableRoutes: {
            auth: '/api/auth/*',
            students: '/api/students/*',
            teachers: '/api/teachers/*',
            admin: '/api/admin/*',
            modules: '/api/modules/*',
            lessons: '/api/lessons/*',
            resources: '/api/resources/*',
            videos: '/api/videos/*',
            aiChat: '/api/ai-chat/*',
            upload: '/api/upload/*',
            payments: '/api/payments/*',
            lexilearn: '/api/lexilearn/*',
            contact: '/api/contact/*'
        }
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/lexilearn', lexilearnRoutes);
app.use('/api/contact', contactRoutes);

// Log all registered routes (helpful for debugging)
console.log('✅ All API routes mounted successfully');
console.log('📋 Available endpoints:');
console.log('   - GET  /health');
console.log('   - GET  /api/test');
console.log('   - POST /api/auth/login');
console.log('   - POST /api/auth/register');
console.log('   - GET  /api/modules');
console.log('   - GET  /api/lessons');
console.log('   - And more...');



// 404 handler
app.use((req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: 'Route not found',
        requestedPath: req.url,
        method: req.method,
        hint: 'Check /api/test for available routes'
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    process.exit(1);
});

