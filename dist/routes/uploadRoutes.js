import express from 'express';
import multer, { MulterError } from 'multer';
import path from 'path';
import csrfTokens from 'csrf'; // CSRF tokens for added security
import rateLimit from 'express-rate-limit'; // Rate limiting to prevent abuse
const router = express.Router();
// Initialize CSRF Tokens
const csrf = new csrfTokens();
// Rate Limiter to prevent abuse of file uploads
const uploadRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many upload requests, please try again later.',
});
// Set up storage and file naming for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // You can customize this directory path
    },
    filename: function (req, file, cb) {
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
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/; // Adjust allowed file types
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
router.post('/upload', uploadRateLimiter, (req, res, next) => {
    // CSRF token validation
    const csrfToken = req.header('X-XSRF-TOKEN');
    const csrfSecret = req.session.csrfSecret;
    if (!csrfSecret || !csrfToken || !csrf.verify(csrfSecret, csrfToken)) {
        res.status(403).json({ error: 'Invalid CSRF token' });
        return;
    }
    next();
}, upload.single('file'), (req, res) => {
    if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
    }
    // Type assertion for uploaded file
    const file = req.file;
    res.json({
        message: 'File uploaded successfully',
        file,
    });
});
// Error handling middleware for multer and other errors
router.use((err, req, res, next) => {
    if (err instanceof MulterError) {
        // Handle multer-specific errors
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({ error: 'File size is too large.' });
        }
        else {
            res.status(400).json({ error: err.message });
        }
    }
    else if (err) {
        // Handle other errors
        res.status(400).json({ error: err.message });
    }
    else {
        next();
    }
});
export default router;
