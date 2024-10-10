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
import { csrfProtection, verifyCsrfToken } from './src/middleware/csrfMiddleware';

// Correct handling of __dirname and __filename in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Handling asynchronous dynamic imports for modules that may not load synchronously
import sessionModule, { SessionOptions } from 'express-session';

let session: typeof sessionModule;

(async () => {
  session = (await import('express-session')).default;
})();
let cookieParser: any;
(async () => {
  cookieParser = (await import('cookie-parser')).default;
})();
let SpotifyWebApi: any;
(async () => {
  SpotifyWebApi = (await import('spotify-web-api-node')).default;
})();
let FileStore: any;
(async () => {
  await Promise.all([
    import('express-session').then(mod => session = mod.default),
    import('session-file-store').then(mod => FileStore = mod.default(session))
  ]);
})();
let helmet: any;
(async () => {
  helmet = (await import('helmet')).default;
})();
let compression: any;
(async () => {
  compression = (await import('compression')).default;
})();

// Import Models
import User from './src/models/User.js';

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

// Session Configuration
(async () => {
  await Promise.all([
    import('express-session').then(mod => session = mod.default),
    import('session-file-store').then(mod => FileStore = mod.default(session))
  ]);

  app.use((await import('express-session')).default({
    store: new FileStore(),
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  }));
})();

// Apply CSRF middleware
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

const authCallbackHandler: RequestHandler = async (req, res) => {
  const code: string | undefined = req.query.code as string | undefined;

  if (!code) {
    res.status(400).send('No code provided');
    return;
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;

    (req.session as any).access_token = access_token;
    (req.session as any).refresh_token = refresh_token;

    res.redirect('/profile');
  } catch (err) {
    res.status(500).send('Authorization failed');
  }
};

app.get('/auth/callback', authCallbackHandler);

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
    res.status(500).send('Failed to fetch profile');
  }
});

// Import Routes
import authRoutes from './src/utils/spotifyAuth.js';
import profileRoutes from './src/routes/profile.js';
import messagingRoutes from './src/routes/messaging.js';
import aiRoutes from './src/routes/ai.js';
import userRoutes from './src/routes/userRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';

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

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  socket.on('disconnect', () => {});
});

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
  } catch (error) {
    process.exit(1);
  }
};
connectDB();

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

function csrf(arg0: { cookie: boolean }) {
  throw new Error('Function not implemented.');
}