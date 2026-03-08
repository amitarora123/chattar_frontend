import { createServer } from 'node:http';
import next from 'next';
import { initSocket } from './lib/socket/socketServer';

const dev = process.env.NODE_ENV !== 'production';
const hostname = dev ? 'localhost' : '0.0.0.0';
const port = Number(process.env.PORT) || 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = initSocket(httpServer);

  const onlineUsers = new Map<string, Set<string>>();

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId;

    if (!userId) {
      console.log('No userId provided');
      return;
    }

    // create set if first device
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }

    onlineUsers.get(userId)!.add(socket.id);

    // send initial presence state to this user
    socket.emit('presence:initial', Array.from(onlineUsers.keys()));

    // notify everyone else
    socket.broadcast.emit('user:online', userId);

    // chat room joining
    socket.on('chat:join', (room) => {
      socket.join(room);
    });

    socket.on('typing:start', ({ room, userId }) => {
      socket.to(room).emit('typing:start', { userId });
    });

    socket.on('typing:stop', ({ room, userId }) => {
      socket.to(room).emit('typing:stop', { userId });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);

      const sockets = onlineUsers.get(userId);

      if (!sockets) return;

      sockets.delete(socket.id);

      // if no devices left, user is offline
      if (sockets.size === 0) {
        onlineUsers.delete(userId);

        console.log(`${userId} is now offline`);

        io.emit('user:offline', userId);
      }
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
