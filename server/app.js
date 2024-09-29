// server/app.js

import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import SpotifyWebApi from 'spotify-web-api-node';
import fileStore from 'session-file-store';
import http from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// Import routes
import authRoutes from './src/routes/spotifyAuth.js';
import profileRoutes from './src/routes/profile.js';
import messagingRoutes from './src/routes/messaging.js';
import aiRoutes from './src/routes/ai.js';
import userRoutes from './src/routes/userRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';

// Import models
import User from './src/models/User.js';
import Profile from './src/models/Profile.js';
import Message from './src/models/Message.js';
import Post from './src/models/Post.js';

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Spotify API setup
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
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
app.use(xss());
app.use(hpp());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
    })
);

// Cookie Parser
app.use(cookieParser());

// Session Configuration with Security Enhancements
app.use(
    session({
        store: new (fileStore(session))(),
        secret: process.env.SESSION_SECRET || 'your-session-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
);

// CSRF Protection Middleware
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Set CSRF token cookie for frontend to use
app.use((req, res, next) => {
    res.cookie('XSRF-TOKEN', req.csrfToken(), {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
        sameSite: 'lax',
    });
    next();
});

// Rate Limiting: Global
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    headers: true,
});
app.use(globalLimiter);

// Rate Limiting: Advanced using rate-limiter-flexible
const rateLimiter = new RateLimiterMemory({
    points: 100,
    duration: 15 * 60,
});

const advancedRateLimiter = (req, res, next) => {
    rateLimiter
        .consume(req.ip)
        .then(() => {
            next();
        })
        .catch(() => {
            res.status(429).send('Too many requests from this IP, please try again after 15 minutes');
        });
};
app.use(advancedRateLimiter);

// Conditional Static File Serving Based on Environment
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('Welcome to the Personality App API');
    });
}

// Test MongoDB Connection
app.get('/test-db', async (req, res) => {
    try {
        const result = await User.findOne();
        res.json(
            result || {
                message: 'Database connection successful, but no data found.',
            }
        );
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Error connecting to the database' });
    }
});

// Spotify OAuth Routes
const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-library-read',
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

// Profile Route
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
        console.error(err);
        res.status(500).send('Failed to fetch profile');
    }
});

// Use Imported Routes with Input Validation
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/messaging', messagingRoutes);
app.use('/ai', aiRoutes);
app.use('/user', userRoutes);
app.use('/upload', uploadRoutes);

// Socket.IO Connection Handling with Security Considerations
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinRoom', ({ roomId }) => {
        if (typeof roomId !== 'string' || roomId.trim() === '') {
            return;
        }
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('sendMessage', ({ roomId, message, sender }) => {
        if (
            typeof roomId !== 'string' ||
            typeof message !== 'string' ||
            typeof sender !== 'string'
        ) {
            return;
        }
        socket.to(roomId).emit('receiveMessage', { message, sender });
    });

    socket.on('sendMedia', ({ roomId, mediaData, mediaType, sender }) => {
        if (
            typeof roomId !== 'string' ||
            typeof mediaData !== 'string' ||
            typeof mediaType !== 'string' ||
            typeof sender !== 'string'
        ) {
            return;
        }
        socket.to(roomId).emit('receiveMedia', { mediaData, mediaType, sender });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Connect to MongoDB with Secure Options
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});