import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Standard cookie configuration for local dev and production
 * - httpOnly: true (prevents client-side JS / XSS access)
 * - secure: false in development over HTTP (browsers reject secure cookies over plain HTTP)
 * - sameSite: 'lax' (permits cross-port same-site credential requests like localhost:5173 -> localhost:5000)
 * - path: '/' (accessible across all API routes)
 * - maxAge: 7 days in milliseconds
 */
export const getCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

/**
 * Generate a signed JWT for a given user ID
 */
const generateToken = (userId, email = '', name = '') => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }
  return jwt.sign({ userId, email, name }, secret, {
    expiresIn: '7d',
  });
};

/**
 * Helper to set secure httpOnly cookie and return standard user JSON
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id ? user._id.toString() : user.id, user.email, user.name);

  res.cookie('token', token, getCookieOptions());

  return res.status(statusCode).json({
    success: true,
    user: {
      id: user._id ? user._id.toString() : user.id,
      name: user.name,
      email: user.email,
      dailyGoal: user.dailyGoal ?? 5,
      themePreference: user.themePreference ?? 'dark',
      createdAt: user.createdAt,
    },
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with hashed password and issue JWT cookie
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate presence of fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const trimmedEmail = email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check for duplicate email in MongoDB
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user in MongoDB
    const newUser = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      passwordHash,
    });

    return sendTokenResponse(newUser, 201, res);
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.',
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Verify credentials, authenticate user, and issue secure httpOnly JWT cookie
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Standardized generic error for login failures to prevent credential enumeration
    const INVALID_CREDENTIALS_MSG = 'Invalid email or password';

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: INVALID_CREDENTIALS_MSG,
      });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Look up user in MongoDB
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: INVALID_CREDENTIALS_MSG,
      });
    }

    // Compare provided password with stored bcrypt hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: INVALID_CREDENTIALS_MSG,
      });
    }

    return sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.',
    });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Clear session / authentication cookie
 */
export const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * @route   GET /api/auth/me
 * @desc    Return currently logged-in user's profile derived from verified JWT & MongoDB
 */
export const getMe = async (req, res) => {
  try {
    // req.userId is guaranteed by authMiddleware
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        dailyGoal: user.dailyGoal ?? 5,
        themePreference: user.themePreference ?? 'dark',
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('getMe Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user details',
    });
  }
};
