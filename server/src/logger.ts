// server/src/logger.ts

import winston, { Logform } from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import './config/env.js';

// Recreate __filename and __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log directory relative to the server root
const logDirectory = path.resolve(__dirname, '../../logs');

// Create log directory if it doesn't exist
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

// Custom log format to avoid logging sensitive information
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }), // Include stack trace if available
    winston.format.printf((info: Logform.TransformableInfo) => {
        // Filter out sensitive information
        let message = info.message;

        // Example: remove tokens or passwords from the message
        message = message.replace(/password=.*?(&|$)/gi, 'password=******$1');
        message = message.replace(/token=.*?(&|$)/gi, 'token=******$1');

        return `${info.timestamp} [${info.level.toUpperCase()}]: ${message}${
            info.stack ? '\nStack trace: ' + info.stack : ''
        }`;
    })
);

// Initialize Winston logger
const logger = winston.createLogger({
    level: 'info', // Set the minimum log level
    format: logFormat,
    transports: [
        // Write all logs with level `error` and below to `error.log`
        new winston.transports.File({
            filename: path.join(logDirectory, 'error.log'),
            level: 'error',
        }),
        // Write all logs with level `info` and below to `combined.log`
        new winston.transports.File({
            filename: path.join(logDirectory, 'combined.log'),
            level: 'info',
        }),
    ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            ),
        })
    );
}

export default logger;
