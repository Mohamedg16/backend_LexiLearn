const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Create storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        crypto.randomBytes(16, (err, buf) => {
            if (err) return cb(err);
            const filename = buf.toString('hex') + path.extname(file.originalname);
            cb(null, filename);
        });
    }
});

// File filter (keep same)
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|wav|ogg|webm|m4a/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname || mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, PDFs, documents, and audio files are allowed.'));
    }
};

// Create multer instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    },
    fileFilter: fileFilter
});

// Middleware for single file upload
const uploadSingle = (fieldName) => {
    return (req, res, next) => {
        const uploadHandler = upload.single(fieldName);

        uploadHandler(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File too large. Maximum size is 10MB'
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
            next();
        });
    };
};

// Middleware for multiple files upload
const uploadMultiple = (fieldName, maxCount = 5) => {
    return (req, res, next) => {
        const uploadHandler = upload.array(fieldName, maxCount);

        uploadHandler(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File too large. Maximum size is 10MB per file'
                    });
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({
                        success: false,
                        message: `Too many files. Maximum is ${maxCount} files`
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
            next();
        });
    };
};

module.exports = {
    upload,
    uploadSingle,
    uploadMultiple
};
