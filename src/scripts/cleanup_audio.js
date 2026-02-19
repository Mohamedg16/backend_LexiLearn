const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

function cleanupOldFiles() {
    console.log('🧹 Starting cleanup script for old audio files...');

    if (!fs.existsSync(UPLOADS_DIR)) {
        console.log('No uploads directory found. Exiting.');
        return;
    }

    const files = fs.readdirSync(UPLOADS_DIR);
    const now = Date.now();
    const SIX_HOURS = 6 * 60 * 60 * 1000;

    let deletedCount = 0;

    files.forEach(file => {
        if (file.endsWith('.mp3') || file.endsWith('.webm') || file.endsWith('.wav')) {
            const filePath = path.join(UPLOADS_DIR, file);
            const stats = fs.statSync(filePath);

            // If file is older than 6 hours
            if (now - stats.mtimeMs > SIX_HOURS) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Deleted: ${file}`);
                deletedCount++;
            }
        }
    });

    console.log(`✅ Cleanup complete. Removed ${deletedCount} files.`);
}

// Run immediately if called directly
if (require.main === module) {
    cleanupOldFiles();
}

module.exports = cleanupOldFiles;
