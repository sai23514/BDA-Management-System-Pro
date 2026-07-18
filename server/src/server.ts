import { createServer } from 'http';
import app from './app.js';
import connectDB from './config/database.js';
import logger from './utils/logger.js';
import { env } from './config/env.js';
import { initSocket } from './socket.js';

// Connect to database
void connectDB();

// Wrap the Express app in an HTTP server so Socket.io can share the same port.
const httpServer = createServer(app);
initSocket(httpServer);

const server = httpServer.listen(env.PORT, () => {
  logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error(`Unhandled Rejection: ${message}`);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

export default server;
