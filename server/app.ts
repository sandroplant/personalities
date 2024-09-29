// server/app.ts

import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { RateLimiterMemory } from 'rate-limiter-flexible';
// import mongoose from 'mongoose'; // Removed duplicate import
import cors from 'cors';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import SpotifyWebApi from 'spotify-web-api-node';
import fileStoreFactory from 'session-file-store';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';
import hpp from 'hpp';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// Import routes without .js extensions
import authRoutes from './src/utils/spotifyAuth';
import profileRoutes from './src/routes/profile';
import messagingRoutes from './src/routes/messaging';
import aiRoutes from './src/routes/ai';
import userRoutes from './src/routes/userRoutes';
import uploadRoutes from './src/routes/uploadRoutes';

// Import models without .js extensions
import User from './src/models/User';
import Profile from './src/models/Profile';
import Message from './src/models/Message';
import Post from './src/models/Post';

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT: number = parseInt(process.env.PORT as string, 10) || 5001;

// Spotify API setup
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID as string,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI as string,
});

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
app.use(xssClean());
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
const FileStore = fileStoreFactory(session);

app.use(
    session({
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
    })
);

// CSRF Protection Middleware
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Set CSRF token cookie for frontend to use
app.use((req: Request, res: Response, next: NextFunction) => {
    res.cookie('XSRF-TOKEN', req.csrfToken(), {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
        sameSite: 'lax',
    });
    next();
});

// Rate Limiting: Global
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    headers: true,
});
app.use(globalLimiter);

// Rate Limiting: Advanced using rate-limiter-flexible
const rateLimiter = new RateLimiterMemory({
    points: 100,
    duration: 15 * 60, // 15 minutes
});

const advancedRateLimiter = (req: Request, res: Response, next: NextFunction) => {
    rateLimiter
        .consume(req.ip || '127.0.0.1')
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
    app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Error connecting to the database' });
    }
});

// Spotify OAuth Routes
const scopes: string[] = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-library-read',
];
const state: string = 'some-state-of-your-choice';

app.get('/login', (req: Request, res: Response) => {
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
    res.redirect(authorizeURL);
});

app.get('/auth/callback', async (req: Request, res: Response) => {
    const code: string | undefined = req.query.code as string | undefined;

    if (!code) {
        return res.status(400).send('No code provided');
    }

    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const { access_token, refresh_token } = data.body;

        // Assuming session has access_token and refresh_token properties
        (req.session as any).access_token = access_token;
        (req.session as any).refresh_token = refresh_token;

        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send('Authorization failed');
    }
});

// Profile Route
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
io.on('connection', (socket: Socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinRoom', ({ roomId }: { roomId: string }) => {
        if (typeof roomId !== 'string' || roomId.trim() === '') {
            return;
        }
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('sendMessage', ({ roomId, message, sender }: { roomId: string; message: string; sender: string }) => {
        if (
            typeof roomId !== 'string' ||
            typeof message !== 'string' ||
            typeof sender !== 'string'
        ) {
            return;
        }
        socket.to(roomId).emit('receiveMessage', { message, sender });
    });

    socket.on('sendMedia', ({ roomId, mediaData, mediaType, sender }: { roomId: string; mediaData: string; mediaType: string; sender: string }) => {
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
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
