import winston from 'winston';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isProduction, env } from '../config/env.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf((info) => {
  const { level, message, timestamp: ts, stack } = info as {
    level: string;
    message: unknown;
    timestamp?: string;
    stack?: string;
  };
  return `${ts} ${level}: ${stack ?? String(message)}`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: combine(colorize(), logFormat),
  }),
];

const exceptionHandlers: winston.transport[] = [
  new winston.transports.Console({
    format: combine(colorize(), logFormat),
  }),
];

const rejectionHandlers: winston.transport[] = [
  new winston.transports.Console({
    format: combine(colorize(), logFormat),
  }),
];

// Only use file transports outside production (e.g. not on serverless platforms)
if (!isProduction) {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const logDirectory = path.resolve(currentDir, '../../logs');

  fs.mkdirSync(logDirectory, { recursive: true });

  transports.push(
    new winston.transports.File({
      filename: path.join(logDirectory, 'error.log'),
      level: 'error',
      maxsize: 5_242_880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDirectory, 'combined.log'),
      maxsize: 5_242_880,
      maxFiles: 5,
    }),
  );

  exceptionHandlers.push(
    new winston.transports.File({ filename: path.join(logDirectory, 'exceptions.log') }),
  );

  rejectionHandlers.push(
    new winston.transports.File({ filename: path.join(logDirectory, 'rejections.log') }),
  );
}

const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat,
  ),
  transports,
  exceptionHandlers,
  rejectionHandlers,
});

export default logger;
