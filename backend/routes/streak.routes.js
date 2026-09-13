import { Router } from 'express';
import { getStreak } from '../controllers/streak.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Protect ALL streak routes with authMiddleware
router.use(authMiddleware);

// GET /api/streak
router.get('/', getStreak);

export default router;
