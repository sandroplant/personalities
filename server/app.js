require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const SpotifyWebApi = require('spotify-web-api-node');
const FileStore = require('session-file-store')(session);
const http = require('http');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./src/utils/spotifyAuth');
const profileRoutes = require('./src/routes/profile');
const messagingRoutes = require('./src/routes/messaging');
const aiRoutes = require('./src/routes/ai');
const User = require('./src/models/User');

const app = express();
const PORT = process.env.PORT || 5002;

// Spotify API setup
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(
  session({
    store: new FileStore(),
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' },
  })
);

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
    res.json(result || { message: 'Database connection successful, but no data found.' });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Error connecting to the database' });
  }
});

// Spotify OAuth routes
const scopes = ['user-read-private', 'user-read-email', 'user-top-read', 'user-library-read'];
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
    const [userData, topArtistsData, topTracksData, currentlyPlayingData] = await Promise.all([
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
