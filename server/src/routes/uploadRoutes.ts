import express, { Request, Response } from 'express';
import multer, { FileFilterCallback , MulterError } from 'multer';
import path from 'path';
import csrfTokens from 'csrf'; // CSRF tokens for added security
import rateLimit from 'express-rate-limit'; // Rate limiting to prevent abuse

const router = express.Router();

// Initialize CSRF Tokens
const csrf = new csrfTokens();

// Rate Limiter to prevent abuse of file uploads
const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 uploads per window
  message: 'Too many upload requests, please try again later.',
});

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
  destination: function (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) {
    cb(null, 'uploads/'); // You can customize this directory path
  },
  filename: function (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
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
    const allowedTypes = /jpeg|jpg|png|gif/; // Adjust allowed file types
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
  (req: Request, res: Response, next: express.NextFunction): void => {
    // CSRF token validation
    const csrfToken = req.header('X-XSRF-TOKEN');
    const csrfSecret = req.session.csrfSecret;

    if (!csrfSecret || !csrfToken || !csrf.verify(csrfSecret, csrfToken)) {
      res.status(403).json({ error: 'Invalid CSRF token' });
      return;
    }

    next();
  },
  upload.single('file'),
  (req: Request, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    // Type assertion for uploaded file
    const file = req.file as UploadedFile;

    res.json({
      message: 'File uploaded successfully',
      file,
    });
  }
);

// Error handling middleware for multer and other errors
router.use((err: any, _req: Request, res: Response, next: express.NextFunction): void => {
  if (err instanceof MulterError) {
    // Handle multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File size is too large.' });
    } else {
      res.status(400).json({ error: err.message });
    }
  } else if (err) {
    // Handle other errors
    res.status(400).json({ error: err.message });
  } else {
    next();
  }
});

export default router;
