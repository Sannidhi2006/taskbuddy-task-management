import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';
import streakRoutes from './routes/streak.routes.js';
import goalRoutes from './routes/goal.routes.js';
import focusRoutes from './routes/focus.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import userRoutes from './routes/user.routes.js';

import { initSocket } from './config/socket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Initialize Authenticated Socket.IO with private user rooms
export const io = initSocket(server, CLIENT_URL);

// Allowed origins for cross-origin local dev and production
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (such as mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/focus-sessions', focusRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to TaskBuddy API - Your friendly task manager',
    health: '/api/health',
  });
});

import path from 'path';
import { fileURLToPath } from 'url';

// Start Server immediately when executed directly as main entry point
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  try {
    // Fail loudly and abort startup if MongoDB connection cannot be established
    await connectDB();

    server.listen(PORT, () => {
      console.log(`🚀 TaskBuddy Backend running on http://localhost:${PORT}`);
      console.log(`🩺 Health check available at http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error(`\n❌ [STARTUP ABORTED] TaskBuddy server could not start because MongoDB connection failed.`);
    console.error(`Error details: ${err.message}\n`);
    process.exit(1);
  }
}

export { app, server };
