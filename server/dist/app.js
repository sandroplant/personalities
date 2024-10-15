import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import rateLimit from 'express-rate-limit';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import SpotifyWebApi from 'spotify-web-api-node';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import User from './models/User.js';
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});
const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5001;
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
app.use(helmet());
app.use(compression());
app.use(mongoSanitize());
app.use(hpp());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(cookieParser());
import { csrfProtection, verifyCsrfToken } from './middleware/csrfMiddleware.js';
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
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        },
    });
    app.use(session);
})();
app.use(csrfProtection);
app.use(verifyCsrfToken);
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    headers: true,
});
app.use(globalLimiter);
const rateLimiter = new RateLimiterMemory({
    points: 100,
    duration: 15 * 60,
});
app.use((req, res, next) => {
    rateLimiter
        .consume(req.ip || '127.0.0.1')
        .then(() => next())
        .catch(() => res
        .status(429)
        .send('Too many requests from this IP, please try again after 15 minutes'));
});
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(__dirname + '/dist'));
    app.get('*', (_req, res) => {
        res.sendFile(__dirname + '/dist/index.html');
    });
}
else {
    app.get('/', (_req, res) => {
        res.send('Welcome to the Personality App API');
    });
}
app.get('/test-db', async (_req, res) => {
    try {
        const result = await User.findOne();
        res.json(result || {
            message: 'Database connection successful, but no data found.',
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error connecting to the database' });
    }
});
app.get('/csrf-token', (req, res) => {
    res.json({ csrfToken: req.cookies._csrf });
});
const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-library-read',
];
const state = 'some-state-of-your-choice';
app.get('/login', (_req, res) => {
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
    res.redirect(authorizeURL);
});
const authCallbackHandler = async (req, res) => {
    const code = req.query.code;
    if (!code) {
        res.status(400).send('No code provided');
        return;
    }
    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const { access_token, refresh_token } = data.body;
        req.session.access_token = access_token;
        req.session.refresh_token = refresh_token;
        const spotifyUser = await spotifyApi.getMe();
        let user = await User.findOne({ spotifyId: spotifyUser.body.id });
        if (!user) {
            user = new User({
                spotifyId: spotifyUser.body.id,
                displayName: spotifyUser.body.display_name,
                email: spotifyUser.body.email,
            });
            await user.save();
        }
        console.log('User found or created:', user);
        req.session.userId = user._id;
        console.log('Session data after storing userId:', req.session);
        res.redirect('/profile');
    }
    catch (err) {
        console.error('Authorization failed:', err);
        res.status(500).send('Authorization failed');
    }
};
app.get('/auth/callback', authCallbackHandler);
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
    }
    catch (err) {
        res.status(500).send('Failed to fetch profile');
    }
});
app.post('/profile', async (req, res) => {
    console.log('Session Data in POST /profile route:', req.session);
    const { name, bio } = req.body;
    if (!name || !bio) {
        res.status(400).json({ error: 'Name and bio are required' });
        return;
    }
    try {
        const userId = req.session.userId;
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
        res
            .status(200)
            .json({ message: 'Profile updated successfully', user: updatedUser });
    }
    catch (error) {
        console.error('Error during profile update:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
import authRoutes from './utils/spotifyAuth.js';
import profileRoutes from './routes/profile.js';
import messagingRoutes from './routes/messaging.js';
import aiRoutes from './routes/ai.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/messaging', messagingRoutes);
app.use('/ai', aiRoutes);
app.use('/user', userRoutes);
app.use('/upload', uploadRoutes);
io.on('connection', (socket) => {
    socket.on('joinRoom', ({ roomId }) => {
        if (typeof roomId !== 'string' || roomId.trim() === '') {
            return;
        }
        socket.join(roomId);
    });
    socket.on('sendMessage', ({ roomId, message, sender, }) => {
        if (typeof roomId !== 'string' ||
            typeof message !== 'string' ||
            typeof sender !== 'string') {
            return;
        }
        socket.to(roomId).emit('receiveMessage', { message, sender });
    });
    socket.on('sendMedia', ({ roomId, mediaData, mediaType, sender, }) => {
        if (typeof roomId !== 'string' ||
            typeof mediaData !== 'string' ||
            typeof mediaType !== 'string' ||
            typeof sender !== 'string') {
            return;
        }
        socket.to(roomId).emit('receiveMedia', { mediaData, mediaType, sender });
    });
    socket.on('disconnect', () => { });
});
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully');
    }
    catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};
connectDB();
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
