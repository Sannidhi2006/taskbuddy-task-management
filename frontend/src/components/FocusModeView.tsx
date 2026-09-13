import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Sparkles,
  Flame,
  Coffee,
  Target,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { type Task } from '../services/taskService';

interface FocusModeViewProps {
  task: Task;
  todayFocusCount: number;
  onCompleteTask: (taskId: string) => Promise<void>;
  onExit: () => void;
  onRecordSession: (taskId: string, duration: number) => Promise<void>;
}

export const FocusModeView: React.FC<FocusModeViewProps> = ({
  task,
  todayFocusCount,
  onCompleteTask,
  onExit,
  onRecordSession,
}) => {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  // 25 minutes for focus, 5 minutes for break
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [isTaskCompleted, setIsTaskCompleted] = useState<boolean>(task.completed);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingSession, setIsSavingSession] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Manage Countdown Timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  // Attempt to save completed session with error retention
  const saveSession = async () => {
    try {
      setIsSavingSession(true);
      setSaveError(null);
      await onRecordSession(task._id, 25);
      setShowCelebration(true);
      setSaveError(null);
    } catch (err: any) {
      console.error('Failed to save focus session:', err);
      setSaveError(err.message || 'Failed to save focus session to server.');
    } finally {
      setIsSavingSession(false);
    }
  };

  // Handle Session Completion
  const handleTimerComplete = async () => {
    if (mode === 'focus') {
      setTimeLeft(0); // Preserve timer state at 00:00 - do not lose state!
      await saveSession();
    } else {
      // Break finished
      setMode('focus');
      setTimeLeft(25 * 60);
      toast.info('Break finished! Ready to focus?');
    }
  };

  const handleStartBreak = () => {
    setSaveError(null);
    setShowCelebration(false);
    setMode('break');
    setTimeLeft(5 * 60);
  };

  const handleStart = () => {
    setShowCelebration(false);
    setSaveError(null);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setShowCelebration(false);
    setSaveError(null);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const handleSwitchMode = (newMode: 'focus' | 'break') => {
    setIsRunning(false);
    setShowCelebration(false);
    setSaveError(null);
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      await onCompleteTask(task._id);
      setIsTaskCompleted(true);
    } catch (err) {
      console.error('Failed to complete task in focus mode:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  // Time format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Progress percentage
  const totalSeconds = mode === 'focus' ? 25 * 60 : 5 * 60;
  const progressPercent = Math.round(((totalSeconds - timeLeft) / totalSeconds) * 100);

  // Format Due Date
  const formatDueDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const dueDateFormatted = formatDueDate(task.dueDate);

  return (
    <div
      id="focus-mode-view"
      className="min-h-[82vh] flex flex-col items-center justify-between py-4 sm:py-6 px-3 sm:px-4 max-w-2xl mx-auto animate-fadeIn relative w-full"
    >
      {/* Ambient background glow spheres for depth */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/12 rounded-full blur-[140px] pointer-events-none -z-10 animate-glowPulse" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/12 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cyan-500/08 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Top Header Bar: Exit & Today's Focus Session Count */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2.5 pb-3 sm:pb-4">
        <button
          type="button"
          id="exit-focus-mode-btn"
          onClick={onExit}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-slate-200 hover:text-white bg-[#0d111d] hover:bg-white/10 border border-white/12 hover:border-white/20 transition-all cursor-pointer shadow-lg shadow-black/50 min-h-[38px] hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Exit Focus Mode</span>
        </button>

        {/* Focus Sessions Today Counter */}
        <div
          id="focus-sessions-today-badge"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0d111d] border border-indigo-500/30 text-indigo-200 text-xs font-bold shadow-lg shadow-black/50 min-h-[38px]"
        >
          <Flame className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Today:</span>
          <span className="font-mono text-amber-300 text-sm font-black px-2.5 py-0.5 rounded-xl bg-black/50 border border-amber-400/30 shadow-inner">
            {todayFocusCount}
          </span>
        </div>
      </div>

      {/* Main Focus Card Container */}
      <div className="w-full card-3d card-accent-purple bg-[#0d111d]/95 backdrop-blur-2xl border border-white/12 rounded-2xl sm:rounded-3xl p-6 sm:p-10 space-y-6 sm:space-y-8 my-auto text-center shadow-2xl shadow-black/80 relative overflow-hidden">
        {/* Subtle Top Mode Indicator Strip */}
        <div
          className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${
            mode === 'focus'
              ? 'from-indigo-500 via-purple-500 to-cyan-400'
              : 'from-emerald-500 via-cyan-500 to-teal-400'
          }`}
        />

        {/* Selected Task Details Section */}
        <div className="space-y-2.5 sm:space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {/* Priority Badge */}
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                task.priority === 'High'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : task.priority === 'Medium'
                  ? 'bg-pink-500/15 text-pink-300 border-pink-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {task.priority} Priority
            </span>

            {/* Category Badge */}
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                task.category === 'Work'
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  : task.category === 'Personal'
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  : 'bg-pink-500/15 text-pink-300 border-pink-500/30'
              }`}
            >
              {task.category}
            </span>

            {/* Due Date if set */}
            {dueDateFormatted && (
              <span className="text-[11px] font-semibold text-slate-300 bg-white/05 border border-white/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>Due: {dueDateFormatted}</span>
              </span>
            )}
          </div>

          {/* Task Title */}
          <h2
            id="focus-task-title"
            className={`text-lg sm:text-2xl font-black tracking-tight text-white max-w-lg mx-auto break-words ${
              isTaskCompleted ? 'line-through text-slate-400' : ''
            }`}
          >
            {task.title}
          </h2>
        </div>

        {/* Mode Selector Tabs (Focus / Break) */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-[#06070a] border border-white/10 shadow-inner max-w-full">
          <button
            type="button"
            id="mode-focus-btn"
            onClick={() => handleSwitchMode('focus')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              mode === 'focus'
                ? 'bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 text-white shadow-md shadow-pink-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5 shrink-0" />
            <span>Focus (25m)</span>
          </button>
          <button
            type="button"
            id="mode-break-btn"
            onClick={() => handleSwitchMode('break')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              mode === 'break'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 shrink-0" />
            <span>Break (5m)</span>
          </button>
        </div>

        {/* Giant Pomodoro Countdown Display */}
        <div className="space-y-3 sm:space-y-4">
          <div
            id="pomodoro-timer-display"
            className="text-6xl sm:text-8xl font-mono font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-100 to-indigo-300 select-none drop-shadow-[0_10px_30px_rgba(99,102,241,0.35)]"
          >
            {formattedTime}
          </div>

          {/* Progress bar under timer */}
          <div className="w-56 sm:w-72 max-w-full mx-auto h-2.5 bg-[#06070a] border border-white/10 rounded-full overflow-hidden shadow-inner relative">
            <div
              className={`h-full rounded-full transition-all duration-300 relative ${
                mode === 'focus'
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400'
                  : 'bg-gradient-to-r from-teal-400 to-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            >
              {progressPercent > 2 && <div className="progress-glow-tip" />}
            </div>
          </div>
        </div>

        {/* Celebratory Message when session finishes successfully */}
        {showCelebration && (
          <div
            id="focus-session-complete-banner"
            className="card-3d bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-emerald-500/20 border border-pink-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-center gap-2.5 text-pink-200 font-extrabold text-xs sm:text-sm animate-celebratePulse shadow-xl shadow-pink-500/20"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-300 shrink-0" />
              <span>🎉 Focus session complete!</span>
            </div>
            <button
              type="button"
              onClick={handleStartBreak}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1.5 rounded-xl border border-emerald-500/30 cursor-pointer ml-0 sm:ml-2 hover:scale-105 transition-transform"
            >
              <span>Start 5m Break</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error Notification Banner if focus session save fails - preserving timer state! */}
        {saveError && (
          <div
            id="focus-session-error-banner"
            className="card-3d bg-red-950/40 border border-red-500/50 rounded-2xl p-3.5 sm:p-4 text-red-200 text-xs sm:text-sm space-y-2 animate-fadeIn text-left"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Focus session finished (25m), but saving failed:</span>
                <p className="text-red-300/80 text-xs mt-0.5">{saveError}</p>
                <p className="text-pink-300 text-[11px] mt-1">
                  Your timer state (00:00) is preserved. You can retry saving or proceed to break.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 justify-end flex-wrap">
              <button
                type="button"
                id="focus-retry-save-btn"
                onClick={saveSession}
                disabled={isSavingSession}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSavingSession ? 'animate-spin' : ''}`} />
                <span>{isSavingSession ? 'Saving...' : 'Retry Save'}</span>
              </button>
              <button
                type="button"
                onClick={handleStartBreak}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 cursor-pointer"
              >
                Proceed to Break
              </button>
            </div>
          </div>
        )}

        {/* Timer Control Buttons (Start / Pause / Reset) */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 pt-1">
          {!isRunning ? (
            <button
              type="button"
              id="timer-start-btn"
              onClick={handleStart}
              className="btn-3d flex items-center justify-center gap-2 px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-400 cursor-pointer shadow-xl shadow-indigo-600/30 min-h-[46px] hover:shadow-indigo-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all"
            >
              <Play className="w-4 h-4 fill-white shrink-0" />
              <span>Start</span>
            </button>
          ) : (
            <button
              type="button"
              id="timer-pause-btn"
              onClick={handlePause}
              className="btn-3d flex items-center justify-center gap-2 px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 hover:from-pink-400 hover:to-red-400 cursor-pointer shadow-xl shadow-pink-500/30 min-h-[46px] hover:shadow-pink-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all"
            >
              <Pause className="w-4 h-4 fill-white shrink-0" />
              <span>Pause</span>
            </button>
          )}

          <button
            type="button"
            id="timer-reset-btn"
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm font-bold text-slate-300 hover:text-white bg-[#0d111d] hover:bg-white/10 border border-white/12 hover:border-white/20 transition-all cursor-pointer min-h-[46px] shadow-lg shadow-black/40 hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset</span>
          </button>
        </div>

        {/* Action: Mark Task Complete Button */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-center">
          <button
            type="button"
            id="focus-complete-task-btn"
            onClick={handleComplete}
            disabled={isCompleting || isTaskCompleted}
            className={`inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer border min-h-[46px] shadow-xl ${
              isTaskCompleted
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 cursor-default'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white border-emerald-400/40 shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>{isTaskCompleted ? 'Task Completed' : 'Complete Task'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocusModeView;
