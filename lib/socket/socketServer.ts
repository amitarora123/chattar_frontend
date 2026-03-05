import { Server as IOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '@/types/socket.types';

export const initSocket = (server: HTTPServer) => {
  if (!global.io) {
    global.io = new IOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >(server);
  }

  return global.io;
};

export const getIO = () => {
  if (!global.io) {
    throw new Error('Socket.io not initialized');
  }

  return global.io;
};
