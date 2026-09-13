import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

/**
 * Middleware to verify JWT and attach authenticated user's ID to the request.
 * Never trusts a userId sent from client-side request body/params/headers.
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Read JWT token from HTTP-only cookie or Authorization header fallback
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is missing in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server authentication configuration error',
      });
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    // Always derive userId from verified JWT - never from request body/params
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userName = decoded.name;

    // Attach user document directly from MongoDB
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }
    req.user = user;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
};

// Re-export alias for flexibility
export const authenticateUser = authMiddleware;
export default authMiddleware;
