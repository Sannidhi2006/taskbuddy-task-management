import { Router } from 'express';
import {
  getTasks,
  getTaskStats,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  undoTask,
  clearAllTasks,
} from '../controllers/task.controller.js';
import { getStreak } from '../controllers/streak.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Protect ALL task routes with authMiddleware
router.use(authMiddleware);

// Task Stats & Streak Routes - registered before /:id to prevent route shadowing
router.get('/stats', getTaskStats);
router.get('/streak', getStreak);

// Routes for /api/tasks
router
  .route('/')
  .get(getTasks)
  .post(createTask)
  .delete(clearAllTasks);

// Specific task modification routes
router.patch('/:id/complete', completeTask);
router.patch('/:id/undo', undoTask);

// Routes for /api/tasks/:id
router
  .route('/:id')
  .put(updateTask)
  .delete(deleteTask);

export default router;
