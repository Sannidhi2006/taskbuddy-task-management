import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let ioInstance = null;

/**
 * Parse cookie header string into key-value object
 */
const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, part) => {
    const [rawKey, rawVal] = part.trim().split('=');
    if (rawKey && rawVal) {
      acc[rawKey] = decodeURIComponent(rawVal);
    }
    return acc;
  }, {});
};

/**
 * Initialize Socket.IO with strict JWT verification and private user rooms
 */
export const initSocket = (httpServer, clientUrl) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    clientUrl,
  ].filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
  });

  // Strict server-side authentication middleware for socket connections
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers?.authorization?.startsWith('Bearer ')) {
        token = socket.handshake.headers.authorization.split(' ')[1];
      }

      if (!token && socket.handshake.headers?.cookie) {
        const cookies = parseCookies(socket.handshake.headers.cookie);
        token = cookies.token;
      }

      if (!token) {
        return next(new Error('Authentication required for real-time connection'));
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return next(new Error('Server configuration error: JWT_SECRET not configured'));
      }

      const decoded = jwt.verify(token, secret);
      if (!decoded || !decoded.userId) {
        return next(new Error('Invalid token payload'));
      }

      // Enforce verified user ID from cryptographically validated token
      socket.userId = decoded.userId.toString();
      next();
    } catch (err) {
      return next(new Error(`Socket authentication error: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    // Automatically join the user's private, isolated socket room
    const userRoom = `user:${socket.userId}`;
    socket.join(userRoom);
    console.log(`⚡ Authenticated socket ${socket.id} joined private room [${userRoom}]`);

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket ${socket.id} disconnected (${reason})`);
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = () => ioInstance;

/**
 * Emit an event strictly to a specific user's private room.
 * Cross-user broadcasting is prevented on the server.
 */
export const emitToUser = (userId, event, payload) => {
  if (ioInstance && userId) {
    const userRoom = `user:${userId.toString()}`;
    ioInstance.to(userRoom).emit(event, payload);
  }
};
