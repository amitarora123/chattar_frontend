'use client';

import { io } from 'socket.io-client';

export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URI || 'http://localhost:8000', {
  autoConnect: false,
});
