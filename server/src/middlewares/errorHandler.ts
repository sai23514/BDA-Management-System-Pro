import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { isDevelopment } from '../config/env.js';
import logger from '../utils/logger.js';

interface AppError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
}

/**
 * Global error-handling middleware. Normalises common Mongoose and JWT
 * errors into consistent HTTP responses.
 */
const errorHandler: ErrorRequestHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = err.statusCode ?? 500;
  let message: string | string[] = err.message || 'Server Error';

  logger.error(`Error: ${err.message}`, { stack: err.stack });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key
  if (err.code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    statusCode = 400;
    message = `${field} already exists`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDevelopment && { stack: err.stack }),
  });
};

export default errorHandler;
