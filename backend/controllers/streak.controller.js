import { CompletionHistory } from '../models/CompletionHistory.js';

/**
 * Helper to safely get an Intl.DateTimeFormat formatter for a given timezone
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
    // Fall back to UTC if client timezone string is invalid
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
};

/**
 * Convert YYYY-MM-DD string to continuous integer epoch day (UTC)
 */
const dateStrToEpochDay = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / (1000 * 60 * 60 * 24));
};

/**
 * @route   GET /api/streak
 * @desc    Calculate currentStreak and bestStreak from user's CompletionHistory records
 * @access  Private (authMiddleware)
 */
export const getStreak = async (req, res) => {
  try {
    const tz = req.query.timezone || 'UTC';
    const formatter = getFormatter(tz);

    // Retrieve all completion records for the authenticated user
    const records = await CompletionHistory.find({ userId: req.userId })
      .select('completedAt')
      .lean();

    if (!records || records.length === 0) {
      return res.status(200).json({
        success: true,
        currentStreak: 0,
        bestStreak: 0,
      });
    }

    // Map each completion timestamp to a unique calendar day (YYYY-MM-DD) in the user's timezone
    const uniqueDaysSet = new Set();
    for (const record of records) {
      if (record.completedAt) {
        const dateKey = formatter.format(new Date(record.completedAt));
        uniqueDaysSet.add(dateKey);
      }
    }

    if (uniqueDaysSet.size === 0) {
      return res.status(200).json({
        success: true,
        currentStreak: 0,
        bestStreak: 0,
      });
    }

    // Convert unique calendar days to integer epoch days for consecutive-day math
    const epochDays = Array.from(uniqueDaysSet).map(dateStrToEpochDay);
    const epochDaysSet = new Set(epochDays);

    // Determine today and yesterday in the user's timezone
    const now = new Date();
    const todayStr = formatter.format(now);
    const todayEpochDay = dateStrToEpochDay(todayStr);
    const yesterdayEpochDay = todayEpochDay - 1;

    // Calculate currentStreak:
    // Consecutive days (up to and including today or yesterday) with at least one completion
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

    // Calculate bestStreak:
    // The longest consecutive sequence in the user's entire completion history
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

    return res.status(200).json({
      success: true,
      currentStreak,
      bestStreak,
    });
  } catch (error) {
    console.error('getStreak Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error calculating completion streak',
    });
  }
};
