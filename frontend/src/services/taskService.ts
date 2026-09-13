import { API_BASE_URL, authFetch } from './api';

export interface Task {
  id: string;
  _id: string;
  userId: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  category: 'General' | 'Work' | 'Personal' | string;
  completed: boolean;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
}

const API_BASE = `${API_BASE_URL}/tasks`;

/**
 * Ensure task object has consistent _id and id fields
 */
export const normalizeTask = (t: any): Task => {
  const taskId = String(t._id || t.id || '');
  return {
    ...t,
    _id: taskId,
    id: taskId,
  };
};

export interface TaskFilters {
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  sortBy?: string;
}

/**
 * Fetch only the logged-in user's tasks from the backend with optional filters
 */
export const getTasks = async (filters?: TaskFilters): Promise<Task[]> => {
  const params = new URLSearchParams();
  if (filters?.search && filters.search.trim()) {
    params.append('search', filters.search.trim());
  }
  if (filters?.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters?.priority && filters.priority !== 'all') {
    params.append('priority', filters.priority);
  }
  if (filters?.category && filters.category !== 'all') {
    params.append('category', filters.category);
  }
  if (filters?.sortBy && filters.sortBy !== 'newest') {
    params.append('sortBy', filters.sortBy);
  }

  const queryStr = params.toString();
  const url = queryStr ? `${API_BASE}?${queryStr}` : API_BASE;

  const res = await authFetch(url, {
    method: 'GET',
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch tasks');
  }

  // Ensure _id and id are always populated
  return (data.tasks || []).map(normalizeTask);
};

/**
 * Create a new task for the authenticated user
 */
export const createTask = async (taskData: {
  title: string;
  priority?: string;
  category?: string;
  dueDate?: string | null;
}): Promise<Task> => {
  const res = await authFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to create task');
  }

  return normalizeTask(data.task);
};

/**
 * Update an existing task's title, priority, category, or dueDate
 */
export const updateTask = async (
  id: string,
  updates: { title?: string; priority?: string; category?: string; dueDate?: string | null }
): Promise<Task> => {
  const res = await authFetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to update task');
  }

  return normalizeTask(data.task);
};

/**
 * Mark task as completed
 */
export const completeTask = async (id: string): Promise<Task> => {
  const res = await authFetch(`${API_BASE}/${id}/complete`, {
    method: 'PATCH',
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to mark task completed');
  }

  return normalizeTask(data.task);
};

/**
 * Mark task as incomplete (undo)
 */
export const undoTask = async (id: string): Promise<Task> => {
  const res = await authFetch(`${API_BASE}/${id}/undo`, {
    method: 'PATCH',
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to undo task completion');
  }

  return normalizeTask(data.task);
};

/**
 * Delete a specific task
 */
export const deleteTask = async (id: string): Promise<void> => {
  const res = await authFetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to delete task');
  }
};

/**
 * Clear all tasks belonging to the logged-in user
 */
export const clearAllTasks = async (): Promise<number> => {
  const res = await authFetch(API_BASE, {
    method: 'DELETE',
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to clear tasks');
  }

  return data.deletedCount || 0;
};

export interface TaskStreak {
  currentStreak: number;
  bestStreak: number;
}

/**
 * Fetch live task statistics for the logged-in user from GET /api/tasks/stats
 */
export const getTaskStats = async (): Promise<TaskStats> => {
  const res = await authFetch(`${API_BASE}/stats`, {
    method: 'GET',
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch task stats');
  }

  return {
    total: Number(data.total ?? data.stats?.total ?? 0),
    completed: Number(data.completed ?? data.stats?.completed ?? 0),
    pending: Number(data.pending ?? data.stats?.pending ?? 0),
  };
};

export interface DailyGoalData {
  dailyGoal: number;
  tasksCompletedToday: number;
}

/**
 * Fetch user's completion streak from GET /api/streak
 */
export const getStreak = async (): Promise<TaskStreak> => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const res = await authFetch(`${API_BASE_URL}/streak?timezone=${encodeURIComponent(userTimezone)}`, {
    method: 'GET',
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch streak');
  }

  return {
    currentStreak: Number(data.currentStreak ?? 0),
    bestStreak: Number(data.bestStreak ?? 0),
  };
};

/**
 * Fetch user's daily goal & tasksCompletedToday from GET /api/goals
 */
export const getDailyGoal = async (): Promise<DailyGoalData> => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const res = await authFetch(`${API_BASE_URL}/goals?timezone=${encodeURIComponent(userTimezone)}`, {
    method: 'GET',
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch daily goal');
  }

  return {
    dailyGoal: Number(data.dailyGoal ?? 5),
    tasksCompletedToday: Number(data.tasksCompletedToday ?? 0),
  };
};

/**
 * Update user's daily goal via PUT /api/goals
 */
export const updateDailyGoal = async (dailyGoal: number): Promise<DailyGoalData> => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const res = await authFetch(`${API_BASE_URL}/goals?timezone=${encodeURIComponent(userTimezone)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dailyGoal }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to update daily goal');
  }

  return {
    dailyGoal: Number(data.dailyGoal ?? 5),
    tasksCompletedToday: Number(data.tasksCompletedToday ?? 0),
  };
};

export interface FocusSessionData {
  id: string;
  userId: string;
  taskId?: string | null;
  duration: number;
  startedAt: string;
  completedAt: string;
}

/**
 * Record a completed focus session linked to user and task
 */
export const recordFocusSession = async (
  taskId?: string | null,
  duration = 25
): Promise<FocusSessionData> => {
  const res = await authFetch(`${API_BASE_URL}/focus-sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ taskId, duration }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to record focus session');
  }

  return data.session;
};

/**
 * Get count of focus sessions completed today in user's timezone
 */
export const getTodayFocusSessions = async (): Promise<{ count: number }> => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const res = await authFetch(
    `${API_BASE_URL}/focus-sessions/today?timezone=${encodeURIComponent(userTimezone)}`,
    {
      method: 'GET',
    }
  );

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch today focus sessions');
  }

  return { count: Number(data.count ?? 0) };
};

export interface WeeklyBreakdownDay {
  day: string;
  date: string;
  count: number;
}

export interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  totalFocusSessions: number;
  mostUsedCategory: string;
  mostCommonPriority: string;
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  weeklyBreakdown: WeeklyBreakdownDay[];
}

/**
 * Fetch user analytics metrics and weekly breakdown from GET /api/analytics
 */
export const getAnalytics = async (): Promise<AnalyticsData> => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const res = await authFetch(
    `${API_BASE_URL}/analytics?timezone=${encodeURIComponent(userTimezone)}`,
    {
      method: 'GET',
    }
  );

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch analytics');
  }

  return {
    totalTasks: Number(data.totalTasks ?? 0),
    completedTasks: Number(data.completedTasks ?? 0),
    pendingTasks: Number(data.pendingTasks ?? 0),
    completionRate: Number(data.completionRate ?? 0),
    currentStreak: Number(data.currentStreak ?? 0),
    bestStreak: Number(data.bestStreak ?? 0),
    totalFocusSessions: Number(data.totalFocusSessions ?? 0),
    mostUsedCategory: String(data.mostUsedCategory || 'None'),
    mostCommonPriority: String(data.mostCommonPriority || 'None'),
    tasksCompletedToday: Number(data.tasksCompletedToday ?? 0),
    tasksCompletedThisWeek: Number(data.tasksCompletedThisWeek ?? 0),
    weeklyBreakdown: Array.isArray(data.weeklyBreakdown) ? data.weeklyBreakdown : [],
  };
};
