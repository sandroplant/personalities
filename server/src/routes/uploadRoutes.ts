// server/src/routes/uploadRoutes.ts

import express, {
    Request,
    Response,
    NextFunction,
    ErrorRequestHandler,
} from 'express';
import multer, { FileFilterCallback, MulterError } from 'multer';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { verifyCsrfToken } from '../middleware/csrfMiddleware.js';
import sanitizeHtml from 'sanitize-html';

const router = express.Router();

// Rate Limiter to prevent abuse of file uploads
const uploadRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 uploads per window
    message: 'Too many upload requests, please try again later.',
});

// Set up storage and file naming for multer
const storage = multer.diskStorage({
    destination: function (
        _req: Request,
        _file: Express.Multer.File, // Prefixed with _
        cb: (_error: Error | null, _destination: string) => void // Prefixed with _
    ) {
        cb(null, 'uploads/');
    },
    filename: function (
        _req: Request,
        file: Express.Multer.File,
        cb: (_error: Error | null, _filename: string) => void // Prefixed with _
    ) {
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
    fileFilter: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileFilterCallback
    ) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(
            path.extname(file.originalname).toLowerCase()
        );
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            return cb(new Error('Only images are allowed!'));
        }
    },
});

// Upload a single file route with CSRF protection and rate limiting
router.post(
    '/upload',
    uploadRateLimiter,
    verifyCsrfToken,
    upload.single('file'),
    (req: Request, res: Response): void => {
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
    }
);

/**
 * Error handling middleware for multer and other errors.
 * Defined separately with explicit typing to satisfy ESLint and TypeScript.
 */
const errorHandler: ErrorRequestHandler = (
    err: unknown,
    _req: Request, // Prefixed with _
    res: Response,
    _next: NextFunction // Prefixed with _
): void => {
    if (err instanceof MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({ error: 'File size is too large.' });
        } else {
            res.status(400).json({ error: err.message });
        }
    } else if (err instanceof Error) {
        res.status(400).json({ error: err.message });
    } else {
        res.status(400).json({ error: 'An unknown error occurred.' });
    }
    // Note: No need to call _next() since we're handling the error
};

// Apply the error handling middleware
router.use(errorHandler);

export default router;
