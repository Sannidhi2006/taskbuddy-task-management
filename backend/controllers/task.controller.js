import mongoose from 'mongoose';
import { Task, PRIORITY_LEVELS, CATEGORIES } from '../models/Task.js';
import { CompletionHistory } from '../models/CompletionHistory.js';
import { emitToUser } from '../config/socket.js';

/**
 * Validate MongoDB ObjectId format
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Helper to validate date inputs safely
 */
const isValidDate = (val) => {
  if (!val) return false;
  const d = new Date(val);
  if (isNaN(d.getTime())) return false;
  const year = d.getFullYear();
  if (year < 1970 || year > 9999) return false;
  if (typeof val === 'string' && /[a-zA-Z]{4,}/.test(val) && !/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(val)) {
    return false;
  }
  return true;
};

/**
 * Helper to escape regex special characters for safe searching
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @route   GET /api/tasks/stats
 * @desc    Calculate live task statistics (total, completed, pending) for the authenticated user
 * @access  Private (authMiddleware)
 */
export const getTaskStats = async (req, res) => {
  try {
    const total = await Task.countDocuments({ userId: req.userId });
    const completed = await Task.countDocuments({ userId: req.userId, completed: true });
    const pending = total - completed;

    return res.status(200).json({
      success: true,
      total,
      completed,
      pending,
      stats: {
        total,
        completed,
        pending,
      },
    });
  } catch (error) {
    console.error('getTaskStats Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error calculating task statistics',
    });
  }
};

/**
 * @route   GET /api/tasks
 * @desc    Get authenticated user's tasks with optional search, status, priority, category, and sortBy filters
 * @access  Private (authMiddleware)
 */
export const getTasks = async (req, res) => {
  try {
    const { search, status, priority, category, sortBy } = req.query;

    // Strict user isolation filter: logged-in user only
    const filter = { userId: req.userId };

    // 1. Search filter: matches task title, case-insensitive
    if (search && typeof search === 'string' && search.trim()) {
      filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    // 2. Status filter: all / pending / completed
    if (status && typeof status === 'string') {
      const normalizedStatus = status.toLowerCase().trim();
      if (normalizedStatus === 'completed') {
        filter.completed = true;
      } else if (normalizedStatus === 'pending') {
        filter.completed = false;
      }
      // 'all' or any other value leaves filter.completed unrestricted
    }

    // 3. Priority filter: all / high / medium / low
    if (priority && typeof priority === 'string') {
      const normalizedPriority = priority.toLowerCase().trim();
      if (normalizedPriority !== 'all') {
        const matched = PRIORITY_LEVELS.find((p) => p.toLowerCase() === normalizedPriority);
        if (matched) {
          filter.priority = matched;
        } else {
          filter.priority = priority.trim();
        }
      }
    }

    // 4. Category filter: all / general / work / personal
    if (category && typeof category === 'string') {
      const normalizedCategory = category.toLowerCase().trim();
      if (normalizedCategory !== 'all') {
        const matched = CATEGORIES.find((c) => c.toLowerCase() === normalizedCategory);
        if (matched) {
          filter.category = matched;
        } else {
          filter.category = category.trim();
        }
      }
    }

    // 5. Query MongoDB
    let query = Task.find(filter);

    // 6. Sort By: newest / oldest / priority-high / priority-low / pending-first / completed-first / dueDate
    const sortParam = typeof sortBy === 'string' ? sortBy.trim() : 'newest';

    switch (sortParam) {
      case 'oldest':
        query = query.sort({ createdAt: 1 });
        break;
      case 'pending-first':
        query = query.sort({ completed: 1, createdAt: -1 });
        break;
      case 'completed-first':
        query = query.sort({ completed: -1, createdAt: -1 });
        break;
      case 'dueDate':
        query = query.sort({ dueDate: 1, createdAt: -1 });
        break;
      case 'newest':
      default:
        query = query.sort({ createdAt: -1 });
        break;
    }

    let tasks = await query;

    // Handle custom priority and due date sort ordering
    if (sortParam === 'priority-high') {
      const weight = { High: 3, Medium: 2, Low: 1 };
      tasks = tasks.sort((a, b) => {
        const diff = (weight[b.priority] || 0) - (weight[a.priority] || 0);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (sortParam === 'priority-low') {
      const weight = { Low: 3, Medium: 2, High: 1 };
      tasks = tasks.sort((a, b) => {
        const diff = (weight[b.priority] || 0) - (weight[a.priority] || 0);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (sortParam === 'dueDate') {
      // Place tasks with valid dueDate first (earliest first), null due dates at the end
      tasks = tasks.sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          if (diff !== 0) return diff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error('getTasks Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving tasks',
    });
  }
};

/**
 * @route   POST /api/tasks
 * @desc    Create a task for the authenticated user (validates title, priority, category, optional dueDate)
 * @access  Private (authMiddleware)
 */
export const createTask = async (req, res) => {
  try {
    const { title, priority, category, dueDate } = req.body;

    // Validate title
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required and cannot be empty',
      });
    }

    if (title.trim().length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Task title cannot exceed 150 characters',
      });
    }

    // Validate priority if provided
    let taskPriority = 'Medium';
    if (priority !== undefined && priority !== null && String(priority).trim() !== '') {
      const trimmedPriority = String(priority).trim();
      const matchedPriority = PRIORITY_LEVELS.find((p) => p.toLowerCase() === trimmedPriority.toLowerCase());
      if (!matchedPriority) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority '${priority}'. Allowed values: ${PRIORITY_LEVELS.join(', ')}`,
        });
      }
      taskPriority = matchedPriority;
    }

    // Validate category if provided
    let taskCategory = 'General';
    if (category !== undefined && category !== null && String(category).trim() !== '') {
      const trimmedCategory = String(category).trim();
      const matchedCategory = CATEGORIES.find((c) => c.toLowerCase() === trimmedCategory.toLowerCase());
      if (!matchedCategory) {
        return res.status(400).json({
          success: false,
          message: `Invalid category '${category}'. Allowed values: ${CATEGORIES.join(', ')}`,
        });
      }
      taskCategory = matchedCategory;
    }

    // Validate optional dueDate if provided
    let parsedDueDate = null;
    if (dueDate !== undefined && dueDate !== null && dueDate !== '') {
      if (!isValidDate(dueDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid dueDate format. Please provide a valid date.',
        });
      }
      parsedDueDate = new Date(dueDate);
    }

    const newTask = await Task.create({
      userId: req.userId,
      title: title.trim(),
      priority: taskPriority,
      category: taskCategory,
      dueDate: parsedDueDate,
      completed: false,
      completedAt: null,
    });

    // Real-time broadcast strictly to this specific authenticated user's private room
    emitToUser(req.userId, 'task:created', newTask);

    return res.status(201).json({
      success: true,
      task: newTask,
    });
  } catch (error) {
    console.error('createTask Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating task',
    });
  }
};

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task title, priority, category, or dueDate with strict ownership check
 * @access  Private (authMiddleware)
 */
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    let { title, priority, category, dueDate } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    // Field-level validations
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Task title cannot be empty',
        });
      }
      if (title.trim().length > 150) {
        return res.status(400).json({
          success: false,
          message: 'Task title cannot exceed 150 characters',
        });
      }
    }

    if (priority !== undefined) {
      const trimmedPriority = String(priority).trim();
      const matchedPriority = PRIORITY_LEVELS.find((p) => p.toLowerCase() === trimmedPriority.toLowerCase());
      if (!matchedPriority) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority '${priority}'. Allowed values: ${PRIORITY_LEVELS.join(', ')}`,
        });
      }
      priority = matchedPriority;
    }

    if (category !== undefined) {
      const trimmedCategory = String(category).trim();
      const matchedCategory = CATEGORIES.find((c) => c.toLowerCase() === trimmedCategory.toLowerCase());
      if (!matchedCategory) {
        return res.status(400).json({
          success: false,
          message: `Invalid category '${category}'. Allowed values: ${CATEGORIES.join(', ')}`,
        });
      }
      category = matchedCategory;
    }

    // Validate optional dueDate if provided
    let parsedDueDate;
    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === '') {
        parsedDueDate = null;
      } else {
        if (!isValidDate(dueDate)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid dueDate format. Please provide a valid date.',
          });
        }
        parsedDueDate = new Date(dueDate);
      }
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (task.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this task',
      });
    }

    if (title !== undefined) task.title = title.trim();
    if (priority !== undefined) task.priority = priority;
    if (category !== undefined) task.category = category;
    if (dueDate !== undefined) task.dueDate = parsedDueDate;

    await task.save();

    // Real-time broadcast strictly to this specific user's private room
    emitToUser(req.userId, 'task:updated', task);

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('updateTask Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating task',
    });
  }
};

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a single task with strict ownership check
 * @access  Private (authMiddleware)
 */
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (task.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to delete this task',
      });
    }

    await task.deleteOne();

    // Clean up associated completion history
    await CompletionHistory.deleteMany({ taskId: id });

    // Real-time broadcast strictly to this specific user's private room
    emitToUser(req.userId, 'task:deleted', { id, _id: id });

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      id,
    });
  } catch (error) {
    console.error('deleteTask Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting task',
    });
  }
};

/**
 * @route   PATCH /api/tasks/:id/complete
 * @desc    Mark a task as completed, timestamp it (completedAt = now), and record CompletionHistory
 * @access  Private (authMiddleware)
 */
export const completeTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (task.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this task',
      });
    }

    const now = new Date();
    task.completed = true;
    task.completedAt = now;
    await task.save();

    // Record completion in history for streaks and analytics (delete any previous duplicate for this task)
    await CompletionHistory.deleteMany({ taskId: task._id });
    await CompletionHistory.create({
      userId: req.userId,
      taskId: task._id,
      completedAt: now,
    });

    emitToUser(req.userId, 'task:completed', task);

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('completeTask Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error marking task completed',
    });
  }
};

/**
 * @route   PATCH /api/tasks/:id/undo
 * @desc    Mark a task as incomplete, clear completedAt, and delete the corresponding CompletionHistory record
 * @access  Private (authMiddleware)
 */
export const undoTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (task.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this task',
      });
    }

    task.completed = false;
    task.completedAt = null;
    await task.save();

    // REMOVE completion history record so undo never leaves a permanent history entry
    await CompletionHistory.deleteMany({ taskId: task._id });

    emitToUser(req.userId, 'task:undone', task);

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('undoTask Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error marking task incomplete',
    });
  }
};

/**
 * @route   DELETE /api/tasks
 * @desc    Clear ALL tasks for only the authenticated user and remove their completion history
 * @access  Private (authMiddleware)
 */
export const clearAllTasks = async (req, res) => {
  try {
    const result = await Task.deleteMany({ userId: req.userId });
    const deletedCount = result.deletedCount;

    // Remove completion history records for this user
    await CompletionHistory.deleteMany({ userId: req.userId });

    emitToUser(req.userId, 'tasks:cleared', { deletedCount });
    emitToUser(req.userId, 'task:cleared', { deletedCount });

    return res.status(200).json({
      success: true,
      message: 'All tasks cleared successfully',
      deletedCount,
    });
  } catch (error) {
    console.error('clearAllTasks Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error clearing tasks',
    });
  }
};
