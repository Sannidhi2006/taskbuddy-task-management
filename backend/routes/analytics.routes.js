import { Router } from 'express';
import { getAnalytics } from '../controllers/analytics.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Protect ALL analytics routes with authMiddleware
router.use(authMiddleware);

// GET /api/analytics
router.get('/', getAnalytics);

export default router;
