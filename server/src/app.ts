// server/src/app.ts

// 1. Load environment variables using dotenv-flow at the very top
import dotenvFlow from 'dotenv-flow';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

// Correct handling of __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize dotenv-flow
dotenvFlow.config({
  silent: false, // Show warnings if .env files are missing
});

console.log('OpenAI API Key:', process.env.OPENAI_API_KEY); // Check if the key is loaded

// 2. Validate required environment variables
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

// 3. Optional: Log the path of the loaded .env files and environment variables (only in development)
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

// 4. Continue with other imports after dotenv-flow and environment variable validation
import express, { NextFunction, RequestHandler } from 'express';
import { Request, Response } from 'express';
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

// 5. Initialize Express app
const app = express();

// 6. Define the port
const PORT: number = parseInt(process.env.PORT as string, 10) || 80; // Default to port 80 if PORT not set

// 7. Create HTTP server
const server = http.createServer(app);

// 8. Initialize Socket.IO with CORS settings
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// 9. Apply Security Middlewares
app.use(helmet());
app.use(compression());
app.use(mongoSanitize());
app.use(hpp());

// 10. Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 11. CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// 12. Cookie Parser Middleware
app.use(cookieParser());

// 13. Initialize Session Middleware Synchronously
import sessionModule from 'express-session';
import FileStoreModule from 'session-file-store';

const FileStore = FileStoreModule(sessionModule);
const session = sessionModule({
  store: new FileStore(),
  secret: process.env.SESSION_SECRET as string, // Already validated to exist
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Secure cookies in production
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
});

// Apply session middleware before routes
app.use(session);

// 14. Initialize Morgan for HTTP request logging with Winston
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

// 15. Apply CSRF protection after session middleware
app.use(csrfProtection);

// 16. Verify CSRF Token for state-changing requests
app.use(verifyCsrfToken);

// 17. Rate Limiting: Global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  headers: true,
});
app.use(globalLimiter);

// 18. Advanced Rate Limiting using rate-limiter-flexible
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

// 19. Conditional Static File Serving Based on Environment
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

// 20. Test MongoDB Connection
app.get('/test-db', async (_req: Request, res: Response) => {
  try {
    const result = await User.findOne();
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

// 21. CSRF Token Route
app.get('/csrf-token', (req: Request, res: Response) => {
  res.json({ csrfToken: req.cookies._csrf });
});

// 22. Spotify OAuth Routes
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

// 23. Spotify Authentication Callback: Store userId in session
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
    const spotifyUser = await spotifyApi.getMe();

    // Check if the user exists in MongoDB or create a new one
    let user = await User.findOne({ spotifyId: spotifyUser.body.id });
    if (!user) {
      user = new User({
        spotifyId: spotifyUser.body.id,
        displayName: spotifyUser.body.display_name,
        email: spotifyUser.body.email,
      });
      await user.save();
      logger.info(`✅ New user created: ${user.displayName} (${user.spotifyId})`);
    } else {
      logger.info(`✅ Existing user found: ${user.displayName} (${user.spotifyId})`);
    }

    // Log to verify the user and session (only in development)
    if (process.env.NODE_ENV !== 'production') {
      logger.info('✅ Session data after storing userId:', req.session);
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

// 24. Profile Route: GET Profile Data from Spotify
app.get('/profile', async (req: Request, res: Response) => {
  if (!(req.session as any).access_token) {
    logger.warn('❌ Access token missing in session. Redirecting to /login');
    return res.redirect('/login');
  }

  spotifyApi.setAccessToken((req.session as any).access_token);

  try {
    const [userData, topArtistsData, topTracksData, currentlyPlayingData] =
      await Promise.all([
        spotifyApi.getMe(),
        spotifyApi.getMyTopArtists(),
        spotifyApi.getMyTopTracks(),
        spotifyApi.getMyCurrentPlayingTrack(),
      ]);

    const profileData = {
      display_name: userData.body.display_name,
      external_urls: userData.body.external_urls,
      href: userData.body.href,
      id: userData.body.id,
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

// 25. Profile Route: POST to update the user profile
app.post(
  '/profile',
  async (req: Request, res: Response): Promise<void> => {
    if (process.env.NODE_ENV !== 'production') {
      logger.info('✅ Session Data in POST /profile route:', req.session); // Debugging session data
    }

    const { name, bio } = req.body;

    if (!name || !bio) {
      logger.warn('❌ Name and bio are required to update profile');
      res.status(400).json({ error: '❌ Name and bio are required' });
      return;
    }

    try {
      const userId = (req.session as any).userId;

      if (!userId) {
        logger.warn('❌ No user ID in session while attempting to update profile');
        res.status(400).json({ error: '❌ No user ID in session' });
        return;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          name,
          bio,
        },
        { new: true }
      );

      if (!updatedUser) {
        logger.warn(`❌ User not found with ID: ${userId}`);
        res.status(404).json({ error: '❌ User not found' });
        return;
      }

      logger.info(`✅ Profile updated successfully for user: ${updatedUser.displayName}`);
      res
        .status(200)
        .json({ message: '✅ Profile updated successfully', user: updatedUser });
    } catch (error) {
      logger.error('❌ Error during profile update:', error);
      res.status(500).json({ error: '❌ Failed to update profile' });
    }
  }
);

// 26. Import Routes
import authRoutes from './utils/spotifyAuth.js';
import profileRoutes from './routes/profile.js';
import messagingRoutes from './routes/messaging.js';
import aiRoutes from './routes/ai.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// 27. Use Imported Routes with Input Validation
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/messaging', messagingRoutes);
app.use('/ai', aiRoutes);
app.use('/user', userRoutes);
app.use('/upload', uploadRoutes);

// 28. Socket.IO Connection Handling with Security Considerations
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
      socket.to(roomId).emit('receiveMessage', { message, sender });
      logger.info(`📩 Message sent to room ${roomId} by ${sender}`);
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
      socket.to(roomId).emit('receiveMedia', { mediaData, mediaType, sender });
      logger.info(`📁 Media sent to room ${roomId} by ${sender}`);
    }
  );

  socket.on('disconnect', () => {
    logger.info('🔌 Client disconnected from Socket.IO');
  });
});

// 29. MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1); // Exit the application if DB connection fails
  }
};
connectDB();

// 30. Start Server
server.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
});

// =============================
// Additional Best Practices
// =============================

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
