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
const taskRoutes = require('./routes/taskRoutes');


const app = express();

// Trust Proxy for Render
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// ============================================================================
// CORS CONFIGURATION - MUST BE BEFORE ALL ROUTES
// ============================================================================

// Define allowed origins
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://lexilearn-lige.onrender.com',
    'https://lexilearn.onrender.com',
    process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

console.log('🔐 CORS Configuration:');
console.log('   Allowed Origins:', allowedOrigins);
console.log('   Environment:', process.env.NODE_ENV);

// CORS options with proper configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
            console.log('✅ CORS: Allowing request with no origin (Postman/Mobile)');
            return callback(null, true);
        }

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            console.log('✅ CORS: Allowing origin:', origin);
            return callback(null, true);
        }

        // Allow all Render subdomains in production
        if (origin.includes('.onrender.com')) {
            console.log('✅ CORS: Allowing Render subdomain:', origin);
            return callback(null, true);
        }

        // Allow localhost in development
        if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
            console.log('✅ CORS: Allowing localhost in development:', origin);
            return callback(null, true);
        }

        // Block all other origins
        console.log('❌ CORS: Blocking origin:', origin);
        callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
    },
    credentials: true, // Allow cookies and authorization headers
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Set-Cookie'], // Expose cookies to frontend
    optionsSuccessStatus: 200, // For legacy browsers
    preflightContinue: false, // Pass preflight to next handler
    maxAge: 86400 // Cache preflight for 24 hours
};

// Apply CORS middleware BEFORE all other middleware
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors(corsOptions));

// Additional CORS headers for all responses
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Set CORS headers for allowed origins
    if (origin && (allowedOrigins.includes(origin) || origin.includes('.onrender.com'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
    }
    
    // Allow cross-origin resource loading (for media files)
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    next();
});

console.log('✅ CORS middleware configured successfully');

// ============================================================================
// SECURITY MIDDLEWARE - AFTER CORS
// ============================================================================

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false // Disable CSP to avoid blocking cross-origin requests
}));

// Serve static files from uploads directory - IMPORTANT: Matches the file return path
const UPLOADS_PATH = path.resolve(process.cwd(), 'uploads');
console.log('📂 Serving static files from:', UPLOADS_PATH);

// Serve files directly via /api/upload/file route to match what the controller returns
app.use('/api/upload/file', express.static(UPLOADS_PATH, {
    setHeaders: (res, filePath) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        // Force correct MIME type for MP3s to ensure browser playback
        if (filePath.endsWith('.mp3')) {
            res.setHeader('Content-Type', 'audio/mpeg');
        }
    }
}));

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
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        cors: {
            configured: true,
            allowedOrigins: allowedOrigins,
            requestOrigin: req.headers.origin || 'No origin header'
        }
    });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CORS is working correctly!',
        requestOrigin: req.headers.origin || 'No origin',
        allowedOrigins: allowedOrigins,
        headers: {
            'access-control-allow-origin': res.getHeader('access-control-allow-origin'),
            'access-control-allow-credentials': res.getHeader('access-control-allow-credentials')
        }
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
            contact: '/api/contact/*',
            tasks: '/api/tasks/*'
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
app.use('/api/tasks', taskRoutes);

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

