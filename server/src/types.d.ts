// server/src/types.d.ts

declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: 'development' | 'production';
        PORT?: string;
        MONGO_URI: string;
        SECRET_KEY: string;
        SESSION_SECRET: string;
        SPOTIFY_CLIENT_ID: string;
        SPOTIFY_CLIENT_SECRET: string;
        SPOTIFY_REDIRECT_URI: string;
        CLIENT_URL: string;
        OPENAI_API_KEY: string;
        CLOUDINARY_CLOUD_NAME: string;
        CLOUDINARY_API_KEY: string;
        CLOUDINARY_API_SECRET: string;
        // Add other environment variables as needed
    }
}
