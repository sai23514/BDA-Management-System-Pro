import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './config/env.js';
import type { JwtPayload } from './types/index.js';
import logger from './utils/logger.js';

let io: Server | null = null;

const userRoom = (userId: string): string => `user:${userId}`;

/**
 * Initialize the Socket.io server on top of the existing HTTP server.
 * Authenticates each connection with the same JWT access token used by the REST API.
 */
export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        next(new Error('Unauthorized'));
        return;
      }
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      socket.data.userId = decoded.id;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    void socket.join(userRoom(userId));
    logger.info(`Socket connected for user ${userId}`);

    socket.on('chat:typing', (payload: { toUserId?: string; conversationId?: string }) => {
      if (payload?.toUserId) {
        socket.to(userRoom(payload.toUserId)).emit('chat:typing', {
          conversationId: payload.conversationId,
          fromUserId: userId,
        });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected for user ${userId}`);
    });
  });

  logger.info('Socket.io initialized');
  return io;
};

/** Emit an event to a specific user's room. No-ops if sockets are not initialized. */
export const emitToUser = (userId: string, event: string, payload: unknown): void => {
  if (!io) return;
  io.to(userRoom(userId)).emit(event, payload);
};
