import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import SpotifyWebApi from 'spotify-web-api-node';
import fileStore from 'session-file-store';
import http from 'http';
import { Server } from 'socket.io';

// Load environment variables from .env file
dotenv.config();

// Import routes
import authRoutes from './src/utils/spotifyAuth.js';
import profileRoutes from './src/routes/profile.js';
import messagingRoutes from './src/routes/messaging.js';
import aiRoutes from './src/routes/ai.js';
import userRoutes from './src/routes/userRoutes.js'; // Import user routes
import User from './src/models/User.js';

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Spotify API setup
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  })
);
app.use(cookieParser());
app.use(
  session({
    store: new (fileStore(session))(),
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  })
);

// Define global rate limiting rules using express-rate-limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  headers: true
});

// Apply global rate limiting to all requests
app.use(globalLimiter);

// Define advanced rate limiting using rate-limiter-flexible
const rateLimiter = new RateLimiterMemory({
  points: 100, // Number of points
  duration: 15 * 60 // Per 15 minutes
});

// Middleware to use rate-limiter-flexible
const advancedRateLimiter = (req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res
        .status(429)
        .send(
          'Too many requests from this IP, please try again after 15 minutes'
        );
    });
};

// Apply advanced rate limiting globally
app.use(advancedRateLimiter);

// Conditional redirect based on environment
if (process.env.NODE_ENV === 'production') {
  app.get('/', (req, res) => {
    res.redirect('https://www.personalities.life');
  });
} else {
  // Root route for development environment
  app.get('/', (req, res) => {
    res.send('Welcome to the Personality App API');
  });
}

// Test MongoDB connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await User.findOne();
    res.json(
      result || {
        message: 'Database connection successful, but no data found.'
      }
    );
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Error connecting to the database' });
  }
});

// Spotify OAuth routes
const scopes = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-library-read'
];
const state = 'some-state-of-your-choice';

app.get('/login', (req, res) => {
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  res.redirect(authorizeURL);
});

app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;

    req.session.access_token = access_token;
    req.session.refresh_token = refresh_token;

    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Authorization failed');
  }
});

// Profile route
app.get('/profile', async (req, res) => {
  if (!req.session.access_token) {
    return res.redirect('/login');
  }

  spotifyApi.setAccessToken(req.session.access_token);

  try {
    const [userData, topArtistsData, topTracksData, currentlyPlayingData] =
      await Promise.all([
        spotifyApi.getMe(),
        spotifyApi.getMyTopArtists(),
        spotifyApi.getMyTopTracks(),
        spotifyApi.getMyCurrentPlayingTrack()
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
      currently_playing: currentlyPlayingData.body.item
    };

    res.json(profileData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch profile');
  }
});

// Use imported routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/messaging', messagingRoutes);
app.use('/ai', aiRoutes);
app.use('/user', userRoutes); // Use user routes

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a chat room
  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Handle sending text messages
  socket.on('sendMessage', ({ roomId, message, sender }) => {
    socket.to(roomId).emit('receiveMessage', { message, sender });
  });

  // Handle sending media messages
  socket.on('sendMedia', ({ roomId, mediaData, mediaType, sender }) => {
    socket.to(roomId).emit('receiveMedia', { mediaData, mediaType, sender });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
