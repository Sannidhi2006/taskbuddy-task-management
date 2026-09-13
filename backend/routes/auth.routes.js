import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Public auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected auth route
router.get('/me', authMiddleware, getMe);

export default router;
