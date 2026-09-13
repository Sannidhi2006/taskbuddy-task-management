import { Task } from '../models/Task.js';
import { CompletionHistory } from '../models/CompletionHistory.js';
import { FocusSession } from '../models/FocusSession.js';

/**
 * Safe formatter for timezone-aware date formatting
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
 * Convert YYYY-MM-DD string to continuous integer epoch day
 */
const dateStrToEpochDay = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / (1000 * 60 * 60 * 24));
};

/**
 * @route   GET /api/analytics
 * @desc    Get user's task statistics, streaks, focus sessions, category/priority distributions, and weekly breakdown
 * @access  Private (authMiddleware)
 */
export const getAnalytics = async (req, res) => {
  try {
    const tz = req.query.timezone || 'UTC';
    const formatter = getFormatter(tz);

    // 1. Task Counts & Completion Rate
    const totalTasks = await Task.countDocuments({ userId: req.userId });
    const completedTasks = await Task.countDocuments({ userId: req.userId, completed: true });
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 2. Category & Priority Distributions
    const userTasks = await Task.find({ userId: req.userId }).select('priority category').lean();
    const categoryCounts = {};
    const priorityCounts = {};

    for (const t of userTasks) {
      if (t.category) {
        categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
      }
      if (t.priority) {
        priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
      }
    }

    let mostUsedCategory = 'None';
    let maxCatCount = 0;
    for (const [cat, count] of Object.entries(categoryCounts)) {
      if (count > maxCatCount) {
        maxCatCount = count;
        mostUsedCategory = cat;
      }
    }

    let mostCommonPriority = 'None';
    let maxPrioCount = 0;
    for (const [prio, count] of Object.entries(priorityCounts)) {
      if (count > maxPrioCount) {
        maxPrioCount = count;
        mostCommonPriority = prio;
      }
    }

    // 3. Focus Sessions
    const totalFocusSessions = await FocusSession.countDocuments({ userId: req.userId });

    // 4. Streak Calculation & Completion History Metrics
    const completionRecords = await CompletionHistory.find({ userId: req.userId })
      .select('taskId completedAt')
      .lean();

    const uniqueDaysSet = new Set();
    const taskCompletionsByDay = {}; // Map of dateStr -> count of completed tasks

    for (const rec of completionRecords) {
      if (rec.completedAt) {
        const dateKey = formatter.format(new Date(rec.completedAt));
        uniqueDaysSet.add(dateKey);
        taskCompletionsByDay[dateKey] = (taskCompletionsByDay[dateKey] || 0) + 1;
      }
    }

    // Determine today and yesterday in user's timezone
    const now = new Date();
    const todayStr = formatter.format(now);
    const todayEpochDay = dateStrToEpochDay(todayStr);
    const yesterdayEpochDay = todayEpochDay - 1;

    // Calculate Streaks
    const epochDays = Array.from(uniqueDaysSet).map(dateStrToEpochDay);
    const epochDaysSet = new Set(epochDays);

    let currentStreak = 0;
    let startEpochDay = null;

    if (epochDaysSet.has(todayEpochDay)) {
      startEpochDay = todayEpochDay;
    } else if (epochDaysSet.has(yesterdayEpochDay)) {
      startEpochDay = yesterdayEpochDay;
    }

    if (startEpochDay !== null) {
      let checkDay = startEpochDay;
      while (epochDaysSet.has(checkDay)) {
        currentStreak++;
        checkDay--;
      }
    }

    epochDays.sort((a, b) => a - b);
    let bestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < epochDays.length; i++) {
      if (i === 0 || epochDays[i] === epochDays[i - 1] + 1) {
        tempStreak++;
      } else if (epochDays[i] > epochDays[i - 1] + 1) {
        tempStreak = 1;
      }
      if (tempStreak > bestStreak) {
        bestStreak = tempStreak;
      }
    }
    bestStreak = Math.max(bestStreak, currentStreak);

    // 5. Tasks Completed Today
    const tasksCompletedToday = taskCompletionsByDay[todayStr] || 0;

    // 6. Weekly Breakdown (Monday through Sunday of current week)
    const [year, month, day] = todayStr.split('-').map(Number);
    const todayDateObj = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = todayDateObj.getUTCDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
    const daysSinceMonday = (dayOfWeek + 6) % 7; // Monday = 0, Tuesday = 1 ... Sunday = 6
    const mondayEpoch = todayDateObj.getTime() - daysSinceMonday * 86400000;

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyBreakdown = [];
    let tasksCompletedThisWeek = 0;

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(mondayEpoch + i * 86400000);
      const dateStr = dayDate.toISOString().split('T')[0];
      const count = taskCompletionsByDay[dateStr] || 0;
      weeklyBreakdown.push({
        day: dayLabels[i],
        date: dateStr,
        count,
      });
      tasksCompletedThisWeek += count;
    }

    return res.status(200).json({
      success: true,
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      currentStreak,
      bestStreak,
      totalFocusSessions,
      mostUsedCategory,
      mostCommonPriority,
      tasksCompletedToday,
      tasksCompletedThisWeek,
      weeklyBreakdown,
    });
  } catch (error) {
    console.error('getAnalytics Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error generating analytics',
    });
  }
};
