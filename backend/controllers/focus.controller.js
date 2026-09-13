import mongoose from 'mongoose';
import { FocusSession } from '../models/FocusSession.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Helper to get timezone-aware date formatter
 */
const getFormatter = (timeZone = 'UTC') => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
};

/**
 * @route   POST /api/focus-sessions
 * @desc    Save a completed focus session linked to user and task
 * @access  Private (authMiddleware)
 */
export const createFocusSession = async (req, res) => {
  try {
    const { taskId, duration, startedAt, completedAt } = req.body;

    const parsedDuration = duration !== undefined ? Number(duration) : 25;
    if (isNaN(parsedDuration) || parsedDuration < 1) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be at least 1 minute',
      });
    }

    let validTaskId = null;
    if (taskId !== undefined && taskId !== null && taskId !== '') {
      if (!isValidObjectId(taskId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid taskId format',
        });
      }
      validTaskId = taskId;
    }

    const now = new Date();
    const sessionCompletedAt = completedAt ? new Date(completedAt) : now;
    const sessionStartedAt = startedAt
      ? new Date(startedAt)
      : new Date(sessionCompletedAt.getTime() - parsedDuration * 60 * 1000);

    const session = await FocusSession.create({
      userId: req.userId,
      taskId: validTaskId,
      duration: parsedDuration,
      startedAt: sessionStartedAt,
      completedAt: sessionCompletedAt,
    });

    return res.status(201).json({
      success: true,
      message: 'Focus session recorded successfully',
      session,
    });
  } catch (error) {
    console.error('createFocusSession Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error saving focus session',
    });
  }
};

/**
 * @route   GET /api/focus-sessions/today
 * @desc    Get focus session count and records for today's date in user's timezone
 * @access  Private (authMiddleware)
 */
export const getTodayFocusSessions = async (req, res) => {
  try {
    const tz = req.query.timezone || 'UTC';
    const formatter = getFormatter(tz);
    const todayStr = formatter.format(new Date());

    const sessions = await FocusSession.find({ userId: req.userId })
      .sort({ completedAt: -1, createdAt: -1 })
      .populate('taskId', 'title priority category')
      .lean();

    const todaySessions = sessions.filter((s) => {
      const dateToCheck = s.completedAt || s.startedAt;
      if (!dateToCheck) return false;
      return formatter.format(new Date(dateToCheck)) === todayStr;
    });

    return res.status(200).json({
      success: true,
      count: todaySessions.length,
      sessions: todaySessions,
    });
  } catch (error) {
    console.error('getTodayFocusSessions Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving today focus sessions',
    });
  }
};
