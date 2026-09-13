import { User } from '../models/User.js';
import { CompletionHistory } from '../models/CompletionHistory.js';

/**
 * Safe formatter for timezone
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
 * Calculate tasks completed today from CompletionHistory records
 */
const countTasksCompletedToday = async (userId, timeZone = 'UTC') => {
  const formatter = getFormatter(timeZone);
  const todayStr = formatter.format(new Date());

  const records = await CompletionHistory.find({ userId })
    .select('taskId completedAt')
    .lean();

  const todayCompletedTaskIds = new Set();
  for (const record of records) {
    if (record.completedAt) {
      const recordDateStr = formatter.format(new Date(record.completedAt));
      if (recordDateStr === todayStr) {
        todayCompletedTaskIds.add(String(record.taskId));
      }
    }
  }

  return todayCompletedTaskIds.size;
};

/**
 * @route   GET /api/goals
 * @desc    Get user's dailyGoal and tasksCompletedToday (calculated from CompletionHistory)
 * @access  Private (authMiddleware)
 */
export const getGoals = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('dailyGoal').lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const tz = req.query.timezone || 'UTC';
    const tasksCompletedToday = await countTasksCompletedToday(req.userId, tz);
    const dailyGoal = user.dailyGoal ?? 5;

    return res.status(200).json({
      success: true,
      dailyGoal,
      tasksCompletedToday,
    });
  } catch (error) {
    console.error('getGoals Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving daily goal',
    });
  }
};

/**
 * @route   PUT /api/goals
 * @desc    Update user's dailyGoal field
 * @access  Private (authMiddleware)
 */
export const updateDailyGoal = async (req, res) => {
  try {
    const { dailyGoal } = req.body;

    const parsedGoal = Number(dailyGoal);
    if (!Number.isInteger(parsedGoal) || parsedGoal < 1 || parsedGoal > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Daily goal must be a whole number between 1 and 1000',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { dailyGoal: parsedGoal },
      { new: true, runValidators: true }
    ).select('dailyGoal');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const tz = req.query.timezone || 'UTC';
    const tasksCompletedToday = await countTasksCompletedToday(req.userId, tz);

    return res.status(200).json({
      success: true,
      dailyGoal: user.dailyGoal,
      tasksCompletedToday,
      message: 'Daily goal updated successfully',
    });
  } catch (error) {
    console.error('updateDailyGoal Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating daily goal',
    });
  }
};
