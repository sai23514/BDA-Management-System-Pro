import mongoose from 'mongoose';
import { env } from './env.js';
import logger from '../utils/logger.js';

const connectDB = async (): Promise<void> => {
  try {
    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(env.MONGODB_URI, options);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error connecting to MongoDB: ${message}`);
    process.exit(1);
  }
};

export default connectDB;
