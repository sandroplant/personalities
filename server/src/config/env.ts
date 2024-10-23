// server/src/config/env.ts

import { fileURLToPath } from 'url';
import path from 'path';
import dotenvFlow from 'dotenv-flow';

// Correct handling of __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize dotenv-flow
dotenvFlow.config({
    path: path.resolve(__dirname, '../../'), // Adjust the path to point to the 'server' directory
    silent: false, // Show warnings if .env files are missing
});

// Optionally, export any config variables if needed
export {};
