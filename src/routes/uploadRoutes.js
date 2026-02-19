const express = require('express');
const router = express.Router();
const { uploadSingle } = require('../middleware/upload');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');
const { successResponse } = require('../utils/helpers');
const path = require('path');
const fs = require('fs');

/**
 * Upload single file (Disk Storage)
 * POST /api/upload
 */
router.post('/', protect, uploadSingle('file'), (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // URL will be used to retrieve the file via the GET route below
        const fileUrl = `/api/upload/file/${req.file.filename}`;

        return successResponse(res, 201, 'File uploaded to server disk', {
            url: fileUrl,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Retrieve file from local uploads directory
 * GET /api/upload/file/:filename
 */
router.get('/file/:filename', async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../../uploads', req.params.filename);
        console.log(`📁 Asset request: ${req.params.filename}`);

        if (!fs.existsSync(filePath)) {
            console.error(`❌ Asset not found: ${filePath}`);
            return res.status(404).json({
                success: false,
                message: 'Asset not found on server disk'
            });
        }

        // Explicitly handle audio types for better browser compatibility
        const ext = path.extname(req.params.filename).toLowerCase();
        if (ext === '.webm') res.type('audio/webm');
        if (ext === '.ogg') res.type('audio/ogg');
        if (ext === '.mp3') res.type('audio/mpeg');
        if (ext === '.m4a') res.type('audio/mp4');

        return res.sendFile(filePath);
    } catch (error) {
        console.error('File Retrieval Error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve asset from server' });
    }
});

module.exports = router;
