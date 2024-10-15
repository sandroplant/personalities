import express from 'express';
import multer, { MulterError } from 'multer';
import path from 'path';
import csrfTokens from 'csrf';
import rateLimit from 'express-rate-limit';
const router = express.Router();
const csrf = new csrfTokens();
const uploadRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many upload requests, please try again later.',
});
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    },
});
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
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
router.post('/upload', uploadRateLimiter, (req, res, next) => {
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
    const file = req.file;
    res.json({
        message: 'File uploaded successfully',
        file,
    });
});
router.use((err, req, res, next) => {
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
