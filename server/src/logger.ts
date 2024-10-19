import winston, { Logform } from 'winston';
import path from 'path';
import fs from 'fs';
import { __dirname } from './utils/pathUtil.js'; // Import from utility module

// Define log directory relative to the server root
const logDirectory = path.resolve(__dirname, '../../logs');

// Create log directory if it doesn't exist
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Define custom log formats
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.printf(
    (info: Logform.TransformableInfo) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`
  )
);

// Initialize Winston logger
const logger = winston.createLogger({
  level: 'info', // Set the minimum log level
  format: logFormat,
  transports: [
    // Write all logs with level `info` and below to `combined.log`
    new winston.transports.File({
      filename: path.join(logDirectory, 'combined.log'),
      level: 'info',
    }),
    // Write all logs with level `error` and below to `error.log`
    new winston.transports.File({
      filename: path.join(logDirectory, 'error.log'),
      level: 'error',
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
