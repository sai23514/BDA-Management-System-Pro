import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '../constants';

// Socket connects to the server origin, not the /api/v1 REST path.
const SOCKET_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket) {
    if (!socket.connected) socket.connect();
    return socket;
  }
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
