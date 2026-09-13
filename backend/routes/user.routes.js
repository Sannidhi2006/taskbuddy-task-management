import { Router } from 'express';
import { updateThemePreference } from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all user routes with authMiddleware
router.use(authMiddleware);

// PATCH /api/users/theme
router.patch('/theme', updateThemePreference);

export default router;
