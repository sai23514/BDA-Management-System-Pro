import express, { type Request, type Response, type NextFunction } from 'express';
import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import './models/index.js';
import routes from './routes/index.js';
import errorHandler from './middlewares/errorHandler.js';
import logger from './utils/logger.js';
import { env, isDevelopment } from './config/env.js';

const app = express();

// Connect to MongoDB (safe to call multiple times in serverless environments)
const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
};

// Security middleware
app.use(helmet());

// CORS configuration — allow configured client URL and Vercel preview/prod domains
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const allowed =
      origin === env.CLIENT_URL ||
      /\.vercel\.app$/i.test(new URL(origin).hostname) ||
      origin.startsWith('http://localhost:');
    callback(allowed ? null : new Error(`CORS blocked for origin: ${origin}`), allowed);
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
if (isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: { write: (message: string) => logger.info(message.trim()) },
    }),
  );
}

// Rate limiting — respond with JSON so clients can surface a clear message,
// and disable it in development where hot-reload + polling makes it noisy.
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});
app.use('/api', limiter);

// Ensure the database is connected before handling requests (serverless friendly)
app.use(async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`DB connection failed: ${message}`);
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to BDA Module API',
    version: '2.0.0',
    documentation: '/api/v1/health',
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
