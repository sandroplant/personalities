// server/routes/uploadRoutes.ts
import express from 'express';
import multer, { MulterError } from 'multer';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { verifyCsrfToken } from '../middleware/csrfMiddleware.js';
import sanitizeHtml from 'sanitize-html';
const router = express.Router();
// CSRF Tokens initialization removed as it is not used
// Rate Limiter to prevent abuse of file uploads
const uploadRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many upload requests, please try again later.',
});
// Set up storage and file naming for multer
const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (_req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    },
});
// Initialize multer with the storage configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // Limit file size to 2MB
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        else {
            return cb(new Error('Only images are allowed!'));
        }
    },
});
// Upload a single file route with CSRF protection and rate limiting
router.post('/upload', uploadRateLimiter, verifyCsrfToken, upload.single('file'), (req, res) => {
    if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
    }
    // Sanitize file information before sending it back
    const fileInfo = {
        fieldname: sanitizeHtml(req.file.fieldname),
        originalname: sanitizeHtml(req.file.originalname),
        encoding: sanitizeHtml(req.file.encoding),
        mimetype: sanitizeHtml(req.file.mimetype),
        destination: sanitizeHtml(req.file.destination),
        filename: sanitizeHtml(req.file.filename),
        path: sanitizeHtml(req.file.path),
        size: req.file.size,
    };
    res.json({
        message: 'File uploaded successfully',
        file: fileInfo,
    });
});
// Error handling middleware for multer and other errors
router.use((err, _req, res, next) => {
    if (err instanceof MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({ error: 'File size is too large.' });
        }
        else {
            res.status(400).json({ error: err.message });
        }
    }
    else if (err) {
        res.status(400).json({ error: err.message });
    }
    else {
        next();
    }
});
export default router;
