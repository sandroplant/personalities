// server/src/app.ts

// Import the env module to load environment variables at the very top
import './config/env.js'; // Ensure the correct relative path and file extension

// Correct handling of __dirname for ES Modules
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optionally, log the API key to verify it's loaded (remove after testing)
console.log('OpenAI API Key:', process.env.OPENAI_API_KEY);

// Validate required environment variables
const requiredEnvVars = [
  'MONGO_URI',
  'SECRET_KEY',
  'SESSION_SECRET',
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REDIRECT_URI',
  'CLIENT_URL',
  'OPENAI_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(
    `❌ Missing the following environment variables: ${missingEnvVars.join(', ')}`
  );
  process.exit(1); // Exit the application if any required env vars are missing
}

// Import logger after environment variables are loaded
import logger from './logger.js'; // Import the Winston logger

if (process.env.NODE_ENV !== 'production') {
  logger.info('✅ Loaded .env files from:', path.resolve(__dirname, '../'));
  logger.info('✅ Environment Variables:', {
    // Selectively log non-sensitive environment variables
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    CLIENT_URL: process.env.CLIENT_URL,
    // Add other non-sensitive variables as needed
  });
}

// Continue with other imports after dotenv-flow and environment variable validation
import express, { NextFunction, RequestHandler, Request, Response } from 'express';
import { validationResult, body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import mongoose from 'mongoose';
import SpotifyWebApi from 'spotify-web-api-node';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import sanitizeHtml from 'sanitize-html'; // For sanitizing messages
import sessionModule from 'express-session';
import FileStoreModule from 'session-file-store';

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID as string,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI as string,
});

// Import Models
import User from './models/User.js';

// Import Custom CSRF Protection Middleware
import { csrfProtection, verifyCsrfToken } from './middleware/csrfMiddleware.js';

// Initialize Express app
const app = express();

// Define the port
const PORT: number = parseInt(process.env.PORT as string, 10) || 80; // Default to port 80 if PORT not set

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Apply Security Middlewares
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "https:", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "https:"],
      "connect-src": ["'self'", process.env.CLIENT_URL || 'http://localhost:3000'],
      // Add other directives as needed
    },
  })
);
app.use(compression());
app.use(mongoSanitize());
app.use(hpp());

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Cookie Parser Middleware
app.use(cookieParser());

// Initialize Session Middleware Synchronously
const FileStore = FileStoreModule(sessionModule);
const session = sessionModule({
  store: new FileStore(),
  secret: process.env.SESSION_SECRET as string, // Already validated to exist
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Secure cookies in production
    httpOnly: true,
    sameSite: 'strict', // Use 'strict' for better CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
});

// Apply session middleware before routes
app.use(session);

// Initialize Morgan for HTTP request logging with Winston
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => {
        // Remove the newline at the end of the message
        logger.info(message.trim());
      },
    },
  })
);

// Apply CSRF protection after session middleware
app.use(csrfProtection);

// Verify CSRF Token for state-changing requests
app.use(verifyCsrfToken);

// Rate Limiting: Global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  headers: true,
});
app.use(globalLimiter);

// Advanced Rate Limiting using rate-limiter-flexible
const rateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 15 * 60, // 15 minutes
});
app.use((req: Request, res: Response, next: NextFunction) => {
  rateLimiter
    .consume(req.ip || '127.0.0.1')
    .then(() => next())
    .catch(() =>
      res
        .status(429)
        .send('Too many requests from this IP, please try again after 15 minutes')
    );
});

// Conditional Static File Serving Based on Environment
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  app.get('/', (_req: Request, res: Response) => {
    res.send('Welcome to the Personality App API');
  });
}

// Test MongoDB Connection
app.get('/test-db', async (_req: Request, res: Response) => {
  try {
    const result = await User.findOne().exec();
    res.json(
      result || {
        message: 'Database connection successful, but no data found.',
      }
    );
  } catch (error) {
    logger.error('❌ Error connecting to the database:', error);
    res.status(500).json({ error: 'Error connecting to the database' });
  }
});

// CSRF Token Route
app.get('/csrf-token', (req: Request, res: Response) => {
  res.json({ csrfToken: req.cookies._csrf });
});

// Spotify OAuth Routes
const scopes: string[] = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-library-read',
];
const state = 'some-state-of-your-choice';

app.get('/login', (_req: Request, res: Response) => {
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  res.redirect(authorizeURL);
});

// Spotify Authentication Callback: Store userId in session
const authCallbackHandler: RequestHandler = async (req, res) => {
  const code: string | undefined = req.query.code as string | undefined;

  if (!code) {
    logger.warn('❌ No code provided in Spotify callback');
    res.status(400).send('❌ No code provided');
    return;
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;

    // Store access and refresh tokens in session
    (req.session as any).access_token = access_token;
    (req.session as any).refresh_token = refresh_token;

    // Fetch user details from Spotify API
    spotifyApi.setAccessToken(access_token);
    const spotifyUser = await spotifyApi.getMe();

    // Sanitize spotifyUser data
    const spotifyId = sanitizeHtml(spotifyUser.body.id);
    const displayName = sanitizeHtml(spotifyUser.body.display_name || '');
    const email = sanitizeHtml(spotifyUser.body.email || '');

    // Check if the user exists in MongoDB or create a new one
    let user = await User.findOne({ spotifyId }, null, { sanitizeFilter: true }).exec();
    if (!user) {
      user = new User({
        spotifyId,
        displayName,
        email,
      });
      await user.save();
      logger.info(`✅ New user created: ${displayName} (${spotifyId})`);
    } else {
      logger.info(`✅ Existing user found: ${displayName} (${spotifyId})`);
    }

    // Log to verify the user and session (only in development)
    if (process.env.NODE_ENV !== 'production') {
      logger.info('✅ Session data after storing userId:', {
        userId: user._id,
        // Do not log sensitive data like access tokens
      });
    }

    // Store the user ID in the session
    (req.session as any).userId = user._id;

    res.redirect('/profile');
  } catch (err) {
    logger.error('❌ Authorization failed:', err);
    res.status(500).send('❌ Authorization failed');
  }
};

app.get('/auth/callback', authCallbackHandler);

// Profile Route: GET Profile Data from Spotify
app.get('/profile', async (req: Request, res: Response) => {
  if (!(req.session as any).access_token) {
    logger.warn('❌ Access token missing in session. Redirecting to /login');
    return res.redirect('/login');
  }

  spotifyApi.setAccessToken((req.session as any).access_token);

  try {
    const [userData, topArtistsData, topTracksData, currentlyPlayingData] = await Promise.all([
      spotifyApi.getMe(),
      spotifyApi.getMyTopArtists(),
      spotifyApi.getMyTopTracks(),
      spotifyApi.getMyCurrentPlayingTrack(),
    ]);

    const profileData = {
      display_name: sanitizeHtml(userData.body.display_name || ''),
      external_urls: userData.body.external_urls,
      href: userData.body.href,
      id: sanitizeHtml(userData.body.id),
      images: userData.body.images,
      uri: userData.body.uri,
      top_artists: topArtistsData.body.items,
      top_tracks: topTracksData.body.items,
      currently_playing: currentlyPlayingData.body.item,
    };

    logger.info(`✅ Profile data fetched for user: ${profileData.display_name}`);
    res.json(profileData);
  } catch (err) {
    logger.error('❌ Failed to fetch profile:', err);
    res.status(500).send('❌ Failed to fetch profile');
  }
});

// Profile Route: POST to update the user profile
app.post(
  '/profile',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per windowMs
    message: 'Too many profile update requests from this IP, please try again after 15 minutes',
  }),
  verifyCsrfToken,
  body('userId').isString().trim().notEmpty().withMessage('User ID is required'),
  body('name').isString().trim().notEmpty().withMessage('Name must be a string'),
  body('bio').isString().trim().notEmpty().withMessage('Bio must be a string'),
  async (req: Request, res: Response): Promise<void> => {
    if (process.env.NODE_ENV !== 'production') {
      logger.info('✅ Session Data in POST /profile route:', {
        userId: (req.session as any).userId,
        // Do not log sensitive data like access tokens
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    // Sanitize inputs
    const userId = sanitizeHtml(req.body.userId);
    const name = sanitizeHtml(req.body.name);
    const bio = sanitizeHtml(req.body.bio);

    // Validate and cast userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Invalid user ID format' });
      return;
    }
    const validUserId = new mongoose.Types.ObjectId(userId);

    try {
      const updatedUser = await User.findByIdAndUpdate(
        validUserId,
        {
          name,
          bio,
        },
        { new: true, runValidators: true, sanitizeFilter: true }
      );

      if (!updatedUser) {
        logger.warn(`❌ User not found with ID: ${userId}`);
        res.status(404).json({ error: '❌ User not found' });
        return;
      }

      logger.info(`✅ Profile updated successfully for user: ${updatedUser.displayName}`);
      res.status(200).json({ message: '✅ Profile updated successfully', user: updatedUser });
    } catch (error) {
      logger.error('❌ Error during profile update:', error);
      res.status(500).json({ error: '❌ Failed to update profile' });
    }
  }
);

// Import Routes
import authRoutes from './utils/spotifyAuth.js';
import profileRoutes from './routes/profile.js';
import messagingRoutes from './routes/messaging.js';
import aiRoutes from './routes/ai.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Use Imported Routes with Input Validation
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/messaging', messagingRoutes);
app.use('/ai', aiRoutes);
app.use('/user', userRoutes);
app.use('/upload', uploadRoutes);

// Socket.IO Connection Handling with Security Considerations
io.on('connection', (socket: Socket) => {
  logger.info('🔗 New client connected via Socket.IO');

  socket.on('joinRoom', ({ roomId }: { roomId: string }) => {
    if (typeof roomId !== 'string' || roomId.trim() === '') {
      logger.warn('❌ Invalid roomId received in joinRoom event');
      return;
    }
    socket.join(roomId);
    logger.info(`🔑 Client joined room: ${roomId}`);
  });

  socket.on(
    'sendMessage',
    ({
      roomId,
      message,
      sender,
    }: {
      roomId: string;
      message: string;
      sender: string;
    }) => {
      if (
        typeof roomId !== 'string' ||
        typeof message !== 'string' ||
        typeof sender !== 'string'
      ) {
        logger.warn('❌ Invalid data received in sendMessage event');
        return;
      }

      // Sanitize message and sender to prevent XSS
      const cleanMessage = sanitizeHtml(message);
      const cleanSender = sanitizeHtml(sender);

      socket.to(roomId).emit('receiveMessage', { message: cleanMessage, sender: cleanSender });
      logger.info(`📩 Message sent to room ${roomId} by ${cleanSender}`);
    }
  );

  socket.on(
    'sendMedia',
    ({
      roomId,
      mediaData,
      mediaType,
      sender,
    }: {
      roomId: string;
      mediaData: string;
      mediaType: string;
      sender: string;
    }) => {
      if (
        typeof roomId !== 'string' ||
        typeof mediaData !== 'string' ||
        typeof mediaType !== 'string' ||
        typeof sender !== 'string'
      ) {
        logger.warn('❌ Invalid data received in sendMedia event');
        return;
      }

      // Sanitize sender
      const cleanSender = sanitizeHtml(sender);

      // Validate mediaType
      const allowedMediaTypes = ['image', 'video', 'audio'];
      if (!allowedMediaTypes.includes(mediaType)) {
        logger.warn('❌ Invalid mediaType received in sendMedia event');
        return;
      }

      // Emit media data
      socket.to(roomId).emit('receiveMedia', { mediaData, mediaType, sender: cleanSender });
      logger.info(`📁 Media sent to room ${roomId} by ${cleanSender}`);
    }
  );

  socket.on('disconnect', () => {
    logger.info('🔌 Client disconnected from Socket.IO');
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      // Additional options can be specified here
    });
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1); // Exit the application if DB connection fails
  }
};
connectDB();

// Start Server
server.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
});

// =============================
// Additional Best Practices
// =============================

// Configure Express to trust proxies (if behind a proxy like Nginx)
app.set('trust proxy', 1);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally exit the process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception thrown:', error);
  // Optionally exit the process
  process.exit(1);
});

// Centralized Error Handling Middleware
app.use((err: any, _req: Request, res: Response) => {
  logger.error('An error occurred:', err);
  res.status(500).json({ error: 'Internal server error' });
});
