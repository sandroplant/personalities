// src/types/express-session.d.ts

import 'express-session';

declare module 'express-session' {
    interface SessionData {
        code_verifier?: string;
        state?: string;
        access_token?: string;
        refresh_token?: string;
        user?: string; // Add the user property
    }
}