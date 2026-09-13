import { Router } from 'express';
import { getGoals, updateDailyGoal } from '../controllers/goal.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Protect ALL goal routes with authMiddleware
router.use(authMiddleware);

// GET /api/goals & PUT /api/goals
router.route('/')
  .get(getGoals)
  .put(updateDailyGoal);

export default router;
