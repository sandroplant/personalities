// server/routes/uploadRoutes.ts

import express, { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { MulterError } from 'multer';

const router = express.Router();

// Define interface for uploaded file
interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
}

// Set up storage and file naming for multer
const storage = multer.diskStorage({
    destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
        cb(null, 'uploads/'); // You can customize this directory path
    },
    filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    },
});

// Initialize multer with the storage configuration
const upload = multer({
    storage: storage,
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        const allowedTypes = /jpeg|jpg|png|gif/; // Adjust allowed file types
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            return cb(new Error('Only images are allowed!'));
        }
    },
});

// Upload a single file route
router.post(
    '/upload',
    upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Type assertion for uploaded file
        const file = req.file as UploadedFile;

        res.json({
            message: 'File uploaded successfully',
            file,
        });
    }
);

// Error handling middleware for multer
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        // Handle multer-specific errors
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size is too large.' });
        }
        return res.status(400).json({ error: err.message });
    } else if (err) {
        // Handle other errors
        return res.status(400).json({ error: err.message });
    }
    next();
});

export default router;
