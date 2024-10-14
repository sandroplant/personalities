import dotenv from 'dotenv';
dotenv.config();

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
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import SpotifyWebApi from 'spotify-web-api-node';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import csrf from 'csurf'; // Imported CSRF protection

// Correct handling of __dirname and __filename in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import Models
import User from './models/User.js';

// Spotify API setup
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID as string,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI as string,
});

// Create Express app
const app = express();
const PORT: number = parseInt(process.env.PORT as string, 10) || 5001;

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

// CSRF Protection Middleware
const csrfProtection = csrf({ cookie: true });

// Session Middleware Configuration
import sessionModule from 'express-session';
import FileStoreModule from 'session-file-store';

(async () => {
  const FileStore = FileStoreModule(sessionModule);
  const session = sessionModule({
    store: new FileStore(),
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // secure for production
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  });

  // Session middleware must be applied before routes
  app.use(session);
})();

// Apply CSRF protection after session middleware
app.use(csrfProtection);

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
const advancedRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  rateLimiter
    .consume(req.ip || '127.0.0.1')
    .then(() => next())
    .catch(() =>
      res
        .status(429)
        .send(
          'Too many requests from this IP, please try again after 15 minutes'
        )
    );
};

app.use(advancedRateLimiter);

// Conditional Static File Serving Based on Environment
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(__dirname + '/dist'));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/dist/index.html');
  });
} else {
  app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the Personality App API');
  });
}

// Test MongoDB Connection
app.get('/test-db', async (req: Request, res: Response) => {
  try {
    const result = await User.findOne();
    res.json(
      result || {
        message: 'Database connection successful, but no data found.',
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error connecting to the database' });
  }
});

// CSRF Token Route
app.get('/csrf-token', (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Spotify OAuth Routes
const scopes: string[] = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-library-read',
];
const state = 'some-state-of-your-choice';

app.get('/login', (req: Request, res: Response) => {
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  res.redirect(authorizeURL);
});

// Spotify Authentication Callback: Store userId in session
const authCallbackHandler: RequestHandler = async (req, res) => {
  const code: string | undefined = req.query.code as string | undefined;

  if (!code) {
    res.status(400).send('No code provided');
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
    }

    // Log to verify the user and session
    console.log('User found or created:', user);

    // Store the user ID in the session
    (req.session as any).userId = user._id;

    // Log the session to ensure userId is stored
    console.log('Session data after storing userId:', req.session);

    res.redirect('/profile');
  } catch (err) {
    console.error('Authorization failed:', err);
    res.status(500).send('Authorization failed');
  }
};

app.get('/auth/callback', authCallbackHandler);

// Profile Route: GET Profile Data from Spotify
app.get('/profile', async (req: Request, res: Response) => {
  if (!(req.session as any).access_token) {
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

    res.json(profileData);
  } catch (err) {
    res.status(500).send('Failed to fetch profile');
  }
});

// Profile Route: POST to update the user profile
app.post('/profile', async (req: Request, res: Response): Promise<void> => {
  console.log('Session Data in POST /profile route:', req.session); // Debugging session data

  const { name, bio } = req.body;

  if (!name || !bio) {
    res.status(400).json({ error: 'Name and bio are required' });
    return;
  }

  try {
    const userId = (req.session as any).userId;

    if (!userId) {
      res.status(400).json({ error: 'No user ID in session' });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, {
      name,
      bio,
    }, { new: true });

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error during profile update:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

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
  socket.on('joinRoom', ({ roomId }: { roomId: string }) => {
    if (typeof roomId !== 'string' || roomId.trim() === '') {
      return;
    }
    socket.join(roomId);
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
        return;
      }
      socket.to(roomId).emit('receiveMessage', { message, sender });
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
        return;
      }
      socket.to(roomId).emit('receiveMedia', { mediaData, mediaType, sender });
    }
  );

  socket.on('disconnect', () => { });
});

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};
connectDB();

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
