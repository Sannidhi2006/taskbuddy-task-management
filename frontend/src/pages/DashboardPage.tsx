import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { TaskInput } from '../components/TaskInput';
import { TaskList } from '../components/TaskList';
import { TaskProgress } from '../components/TaskProgress';
import { DailyGoalProgress } from '../components/DailyGoalProgress';
import { AnalyticsView } from '../components/AnalyticsView';
import { UserMenu } from '../components/UserMenu';
import { TaskStatsCards } from '../components/TaskStatsCards';
import { TaskFilterControls, type FilterState } from '../components/TaskFilterControls';
import {
  type Task,
  type TaskStats,
  type TaskStreak,
  type DailyGoalData,
  type AnalyticsData,
  getTasks,
  getTaskStats,
  getStreak,
  getDailyGoal,
  updateDailyGoal,
  getAnalytics,
  createTask,
  updateTask,
  completeTask,
  undoTask,
  deleteTask,
  clearAllTasks,
} from '../services/taskService';
import { Trash2, AlertCircle, RefreshCw, ListTodo, Sparkles, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';

import { getSocket } from '../services/socket';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({ total: 0, completed: 0, pending: 0 });
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [streak, setStreak] = useState<TaskStreak>({ currentStreak: 0, bestStreak: 0 });
  const [goalData, setGoalData] = useState<DailyGoalData>({ dailyGoal: 5, tasksCompletedToday: 0 });
  const [goalLoading, setGoalLoading] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'all' | 'myDay' | 'analytics'>('all');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    sortBy: 'newest',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  // Helper to determine if a task is Due Today or Overdue
  const isDueTodayOrOverdue = (dueDateStr?: string | null): boolean => {
    if (!dueDateStr) return false;
    const due = new Date(dueDateStr);
    if (isNaN(due.getTime())) return false;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

    return dueDay <= today;
  };

  const myDayRemainingCount = tasks.filter(
    (t) => !t.completed && isDueTodayOrOverdue(t.dueDate)
  ).length;

  const displayedTasks =
    activeView === 'myDay' ? tasks.filter((t) => isDueTodayOrOverdue(t.dueDate)) : tasks;

  const getFriendlyErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (
        msg.includes('failed to fetch') ||
        msg.includes('networkerror') ||
        msg.includes('server error') ||
        msg.includes('econnrefused') ||
        msg.includes('database') ||
        msg.includes('500') ||
        msg.includes('503')
      ) {
        return 'Something went wrong. Please try again.';
      }
      return err.message || 'Something went wrong. Please try again.';
    }
    return 'Something went wrong. Please try again.';
  };

  // 0. Fetch live task statistics from GET /api/tasks/stats
  const loadStats = async () => {
    try {
      const freshStats = await getTaskStats();
      setStats(freshStats);
    } catch (err) {
      console.error('Failed to load task stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // 0b. Fetch user completion streak from GET /api/streak
  const loadStreak = async () => {
    try {
      const freshStreak = await getStreak();
      setStreak(freshStreak);
    } catch (err) {
      console.error('Failed to load streak:', err);
    }
  };

  // 0c. Fetch user daily goal & tasksCompletedToday from GET /api/goals
  const loadGoal = async () => {
    try {
      setGoalLoading(true);
      const freshGoal = await getDailyGoal();
      setGoalData(freshGoal);
    } catch (err) {
      console.error('Failed to load daily goal:', err);
    } finally {
      setGoalLoading(false);
    }
  };

  const handleUpdateDailyGoal = async (newGoal: number) => {
    const updated = await updateDailyGoal(newGoal);
    setGoalData(updated);
  };

  // 0d. Fetch analytics data from GET /api/analytics
  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await getAnalytics();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  // 1. Fetch tasks from backend with active filters & wire up real-time socket
  const loadTasks = async (currentFilters: FilterState = filtersRef.current) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTasks(currentFilters);
      // Guard: deduplicate by _id
      const unique = data.filter(
        (task, index, self) =>
          index === self.findIndex((t) => t._id === task._id)
      );
      setTasks(unique);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    filtersRef.current = newFilters;
    loadTasks(newFilters);
  };

  useEffect(() => {
    loadTasks(filtersRef.current);
    loadStats();
    loadStreak();
    loadGoal();
    loadAnalytics();

    const socket = getSocket();
    socket.connect();

    // Guard: refresh filtered tasks, stats, streak, daily goal, and analytics on real-time updates
    const handleCreated = () => {
      loadTasks(filtersRef.current);
      loadStats();
      loadStreak();
      loadGoal();
      loadAnalytics();
    };

    const handleUpdated = () => {
      loadTasks(filtersRef.current);
      loadStats();
      loadStreak();
      loadGoal();
      loadAnalytics();
    };

    const handleDeleted = () => {
      loadTasks(filtersRef.current);
      loadStats();
      loadStreak();
      loadGoal();
      loadAnalytics();
    };

    const handleCleared = () => {
      setTasks([]);
      setStats({ total: 0, completed: 0, pending: 0 });
      loadStats();
      loadStreak();
      loadGoal();
      loadAnalytics();
    };

    socket.on('task:created', handleCreated);
    socket.on('task:updated', handleUpdated);
    socket.on('task:completed', handleUpdated);
    socket.on('task:undone', handleUpdated);
    socket.on('task:deleted', handleDeleted);
    socket.on('task:cleared', handleCleared);
    socket.on('tasks:cleared', handleCleared);

    return () => {
      socket.off('task:created', handleCreated);
      socket.off('task:updated', handleUpdated);
      socket.off('task:completed', handleUpdated);
      socket.off('task:undone', handleUpdated);
      socket.off('task:deleted', handleDeleted);
      socket.off('task:cleared', handleCleared);
      socket.off('tasks:cleared', handleCleared);
      socket.disconnect();
    };
  }, []);

  // 2. Add Task (calls POST /api/tasks) with duplicate guard
  const handleAddTask = async (newTaskData: {
    title: string;
    priority: string;
    category: string;
    dueDate?: string | null;
  }) => {
    try {
      setError(null);
      await createTask(newTaskData);
      toast.success('Task added successfully');
      await loadTasks(filtersRef.current);
      loadStats();
      loadStreak();
      loadGoal();
      loadAnalytics();
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      setError(msg);
      toast.error(msg);
    }
  };

  // 3. Complete Task (calls PATCH /api/tasks/:id/complete)
  const handleCompleteTask = async (id: string) => {
    try {
      setError(null);
      await completeTask(id);
      toast.success('🎉 Nice! One more task off your list!');

      // Check if daily goal completed
      const prevToday = goalData.tasksCompletedToday;
      const targetGoal = goalData.dailyGoal;
      if (targetGoal > 0 && prevToday + 1 >= targetGoal && prevToday < targetGoal) {
        toast.success("🔥 You did it! Today's goal is complete!");
      }

      await loadTasks(filtersRef.current);
      loadStats();
      loadStreak();
      loadGoal();
      loadAnalytics();
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      setError(msg);
      toast.error(msg);
    }
  };

  // 4. Undo Task (calls PATCH /api/tasks/:id/undo)
  const handleUndoTask = async (id: string) => {
    try {
      setError(null);
      await undoTask(id);
      toast.success('Task restored');
      await loadTasks(filtersRef.current);
      loadStats();
      loadStreak();
      loadGoal();
      loadAnalytics();
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      setError(msg);
      toast.error(msg);
    }
  };

  // 5. Update / Edit Task (calls PUT /api/tasks/:id)
  const handleUpdateTask = async (
    id: string,
    updates: { title?: string; priority?: string; category?: string; dueDate?: string | null }
  ) => {
    try {
      setError(null);
      await updateTask(id, updates);
      toast.success('Task updated successfully');
      await loadTasks(filtersRef.current);
      loadStats();
      loadStreak();
      loadGoal();
      loadAnalytics();
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      setError(msg);
      toast.error(msg);
    }
  };

  // 6. Delete Task (calls DELETE /api/tasks/:id)
  const handleDeleteTask = async (id: string) => {
    try {
      setError(null);
      await deleteTask(id);
      toast.success('Task deleted');
      await loadTasks(filtersRef.current);
      loadStats();
      loadStreak();
      loadGoal();
      loadAnalytics();
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      setError(msg);
      toast.error(msg);
    }
  };

  // 7. Clear All Tasks (calls DELETE /api/tasks)
  const handleClearAll = async () => {
    try {
      setIsClearing(true);
      setError(null);
      await clearAllTasks();
      toast.success('All tasks cleared');
      setTasks([]);
      setStats({ total: 0, completed: 0, pending: 0 });
      setIsConfirmingClearAll(false);
      loadStats();
      loadStreak();
      loadGoal();
      loadAnalytics();
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setIsClearing(false);
    }
  };

  const totalCount = tasks.length;

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Rich ambient multi-color glow spheres at screen edges for depth */}
      <div className="fixed -top-24 -left-24 w-[550px] h-[550px] bg-cyan-500/14 rounded-full blur-[130px] pointer-events-none -z-10 animate-glowPulse" />
      <div className="fixed top-1/4 -right-24 w-[550px] h-[550px] bg-purple-600/16 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-12 left-1/3 w-[500px] h-[400px] bg-pink-500/12 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed -bottom-24 -right-24 w-[450px] h-[450px] bg-rose-500/12 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <Header />

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 space-y-6">
        {/* Top Greeting & User Menu */}
        <section aria-label="Welcome and User Menu" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Welcome back, {user?.name || 'Explorer'}</span>
              <span className="inline-block hover:scale-125 transition-transform duration-200 cursor-default" title="Hello!">👋</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
              Your live productivity overview & daily tasks
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <UserMenu />
          </div>
        </section>

            {/* Three stat cards in a row (stack vertically on mobile): TOTAL, COMPLETED, PENDING */}
            <TaskStatsCards stats={stats} loading={statsLoading} />

            {/* View Mode Toggle: All Tasks vs ☀️ My Day */}
            <section aria-label="Task view mode switcher" className="card-3d flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#0d111d]/90 backdrop-blur-2xl p-2.5 sm:p-2 rounded-2xl sm:rounded-3xl border border-white/12 shadow-xl shadow-black/40 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  id="view-all-tasks-tab"
                  onClick={() => setActiveView('all')}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeView === 'all'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30 scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-white/06'
                    }`}
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>All Tasks</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/50 border border-white/15 font-mono font-bold">
                    {tasks.length}
                  </span>
                </button>

                <button
                  type="button"
                  id="view-my-day-tab"
                  onClick={() => setActiveView('myDay')}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeView === 'myDay'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md shadow-amber-500/30 scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-white/06'
                    }`}
                >
                  <span>☀️ My Day</span>
                  {myDayRemainingCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-200 border border-amber-400/40 font-mono font-extrabold shadow-sm">
                      {myDayRemainingCount}
                    </span>
                  )}
                </button>

                {/* 📊 Analytics Tab */}
                <button
                  type="button"
                  id="view-analytics-tab"
                  onClick={() => {
                    setActiveView('analytics');
                    loadAnalytics();
                  }}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeView === 'analytics'
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-500/30 scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-white/06'
                    }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>📊 Analytics</span>
                </button>

                {/* 🔥 Streak Badge */}
                <div
                  id="streak-badge"
                  title={
                    streak.currentStreak > 0
                      ? `You completed at least one task for ${streak.currentStreak} consecutive day${streak.currentStreak === 1 ? '' : 's'}!`
                      : 'Complete a task today to start your streak!'
                  }
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border select-none ${streak.currentStreak > 0
                    ? 'bg-gradient-to-r from-orange-500/25 via-amber-500/20 to-rose-500/25 text-orange-200 border-orange-500/45 shadow-md shadow-orange-500/15 animate-celebratePulse'
                    : 'bg-white/05 text-slate-400 border-white/10'
                    }`}
                >
                  <span className="text-sm leading-none">🔥</span>
                  <span>{streak.currentStreak} Day Streak</span>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-400 px-1 sm:pr-2 flex items-center justify-between sm:justify-end gap-1.5 shrink-0">
                {activeView === 'myDay' ? (
                  <span className="text-amber-300 flex items-center gap-1.5 font-bold animate-fadeIn">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    {myDayRemainingCount} {myDayRemainingCount === 1 ? 'task' : 'tasks'} remaining
                  </span>
                ) : (
                  <span>
                    {stats.pending} {stats.pending === 1 ? 'task' : 'tasks'} remaining
                  </span>
                )}
              </div>
            </section>

            {/* 🔥 Streak Motivational Note */}
            <div
              id="streak-note-banner"
              className="card-3d card-accent-amber bg-gradient-to-r from-orange-950/30 via-amber-950/20 to-[#0d111d]/90 border border-orange-500/30 rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between text-xs text-orange-200 shadow-md shadow-orange-950/20 animate-fadeIn"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🔥</span>
                <span>
                  {streak.currentStreak > 0 ? (
                    <>

                      Keep the momentum burning!
                    </>
                  ) : (
                    <>Complete at least one task today to ignite your daily streak!</>
                  )}
                </span>
              </div>
              {streak.bestStreak > 0 && (
                <span className="text-[11px] text-amber-300/80 font-bold shrink-0 hidden sm:inline-block bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-xl">
                  Best streak: {streak.bestStreak} {streak.bestStreak === 1 ? 'day' : 'days'}
                </span>
              )}
            </div>

            {activeView === 'analytics' ? (
              /* 📊 Clean Analytics Section */
              <AnalyticsView
                data={analyticsData}
                loading={analyticsLoading}
                onRefresh={loadAnalytics}
              />
            ) : (
              <>
                {/* 🎯 Today's Goal Section */}
                <section aria-label="Today's goal progress">
                  <DailyGoalProgress
                    dailyGoal={goalData.dailyGoal}
                    tasksCompletedToday={goalData.tasksCompletedToday}
                    onUpdateGoal={handleUpdateDailyGoal}
                    loading={goalLoading}
                  />
                </section>

                {/* ☀️ My Day Focus Header Banner */}
                {activeView === 'myDay' && (
                  <div className="card-3d bg-gradient-to-r from-amber-500/10 via-orange-500/05 to-rose-500/10 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between shadow-sm animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl shadow-inner shrink-0">
                        ☀️
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>My Day</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold">
                            {myDayRemainingCount} {myDayRemainingCount === 1 ? 'task' : 'tasks'} remaining
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Tasks due today or overdue requiring your attention
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Notification Banner if an API operation fails */}
                {error && (
                  <div className="p-4 bg-red-500/15 border border-red-500/40 rounded-3xl flex items-center justify-between text-red-200 text-sm animate-fadeIn shadow-xl shadow-red-950/30">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                      <span className="font-medium">{error}</span>
                    </div>
                    <button
                      onClick={() => loadTasks()}
                      className="text-xs font-bold text-red-200 hover:text-white flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-red-500/30"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry
                    </button>
                  </div>
                )}

                {/* 1. Task Creation Row */}
                <section aria-label="Task creation">
                  <TaskInput onAddTask={handleAddTask} />
                </section>

                {/* Task Search, Filters and Sorting Toolbar */}
                <section aria-label="Task search, filters and sorting controls">
                  <TaskFilterControls
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    resultCount={displayedTasks.length}
                  />
                </section>

                {/* Contextual Friendly Messages in UI (not as toasts, small text) */}
                {stats.total > 0 && stats.pending >= 5 && (
                  <div
                    id="contextual-many-pending-msg"
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold animate-fadeIn shadow-sm"
                  >
                    <span>👀 You've got {stats.pending} tasks waiting. Let's tackle one!</span>
                  </div>
                )}

                {stats.total > 0 && stats.pending === 0 && (
                  <div
                    id="contextual-all-completed-msg"
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold animate-fadeIn shadow-sm"
                  >
                    <span>🥳 You're all done! Amazing work!</span>
                  </div>
                )}

                {/* 2. Task List Area */}
                <section aria-label="Task list" className="space-y-3">
                  {activeView === 'myDay' && displayedTasks.length === 0 ? (
                    <div className="card-3d bg-[#0e1017]/85 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
                        ☀️
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        No tasks due today or overdue
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mt-1.5">
                        You're all caught up! Any task with a due date of today or earlier will automatically appear in this view.
                      </p>
                    </div>
                  ) : (
                    <TaskList
                      tasks={displayedTasks}
                      loading={loading}
                      onComplete={handleCompleteTask}
                      onUndo={handleUndoTask}
                      onDelete={handleDeleteTask}
                      onUpdate={handleUpdateTask}
                    />
                  )}
                </section>

                {/* 3. Progress Section */}
                <section aria-label="Task progress">
                  <TaskProgress tasks={displayedTasks} />
                </section>

                {/* 4. Clear All Tasks Button (very bottom) */}
                <div className="pt-3 pb-8 flex justify-center">
                  <button
                    type="button"
                    id="clear-all-tasks-button"
                    onClick={() => setIsConfirmingClearAll(true)}
                    disabled={totalCount === 0 || loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold tracking-wide text-slate-400 hover:text-white bg-[#0e1017] hover:bg-red-950/40 border border-white/10 hover:border-red-500/40 transition-all duration-200 cursor-pointer shadow-md shadow-black/50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-[#0e1017] disabled:hover:border-white/10"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Clear All Tasks</span>
                  </button>
                </div>
              </>
            )}

        {/* Confirmation Modal Dialog */}
        {isConfirmingClearAll && (
          <div
            id="clear-all-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
            onClick={() => !isClearing && setIsConfirmingClearAll(false)}
          >
            <div
              className="card-3d bg-[#10131d] border border-red-500/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl shadow-black/90 space-y-4 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400 shadow-inner">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="clear-modal-title" className="text-base font-bold text-white">
                    Clear All Tasks?
                  </h3>
                  <p className="text-sm text-slate-300 mt-1">
                    Are you sure you want to delete all tasks? This cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  id="cancel-clear-all"
                  onClick={() => setIsConfirmingClearAll(false)}
                  disabled={isClearing}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#07080c] hover:bg-white/10 border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-clear-all"
                  onClick={handleClearAll}
                  disabled={isClearing}
                  className="btn-3d px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isClearing ? 'Clearing...' : 'Yes, Delete All'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;



