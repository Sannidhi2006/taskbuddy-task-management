import { Router } from 'express';
import {
  createFocusSession,
  getTodayFocusSessions,
} from '../controllers/focus.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Protect ALL focus session routes with authMiddleware
router.use(authMiddleware);

// GET /api/focus-sessions & POST /api/focus-sessions
router.route('/')
  .get(getTodayFocusSessions)
  .post(createFocusSession);

// GET /api/focus-sessions/today
router.get('/today', getTodayFocusSessions);

export default router;
