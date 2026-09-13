import React from 'react';
import { Target, Sparkles, CalendarCheck } from 'lucide-react';

interface DailyGoalProgressProps {
  /** Total number of tasks whose due date is exactly today */
  dailyGoal: number;
  /** Number of those tasks that are marked completed */
  tasksCompletedToday: number;
  loading?: boolean;
}

export const DailyGoalProgress: React.FC<DailyGoalProgressProps> = ({
  dailyGoal,
  tasksCompletedToday,
  loading = false,
}) => {
  const percentage =
    dailyGoal > 0 ? Math.min(100, Math.round((tasksCompletedToday / dailyGoal) * 100)) : 0;
  const fillWidth =
    dailyGoal > 0 ? Math.min(100, (tasksCompletedToday / dailyGoal) * 100) : 0;
  const isGoalReached = dailyGoal > 0 && tasksCompletedToday >= dailyGoal;

  return (
    <div
      id="daily-goal-section"
      className="card-3d card-accent-purplish-pink bg-gradient-to-br from-[#160b24]/95 via-[#11091a]/95 to-[#0b0c16]/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden shadow-xl shadow-fuchsia-950/40 transition-all duration-300 border border-fuchsia-500/35 hover:border-fuchsia-500/55"
    >
      {/* Subtle top purplish-pink aura */}
      <div className="absolute top-0 left-1/4 w-80 h-36 bg-gradient-to-r from-purple-500/20 via-fuchsia-500/25 to-pink-500/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Row: Title and auto-derived target badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/30 via-fuchsia-500/30 to-pink-500/30 border border-fuchsia-400/40 flex items-center justify-center text-fuchsia-300 shrink-0 shadow-inner shadow-fuchsia-500/20">
            <Target className="w-5 h-5 text-fuchsia-300 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 flex-wrap">
              <span>Today's Goal</span>
              {loading ? (
                <span className="text-[11px] font-extrabold text-fuchsia-200 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/25 via-fuchsia-500/25 to-pink-500/25 border border-fuchsia-400/45 font-mono shadow-[0_0_12px_rgba(217,70,239,0.25)] opacity-50">
                  Loading…
                </span>
              ) : dailyGoal === 0 ? (
                <span className="text-[11px] font-extrabold text-fuchsia-200 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/25 via-fuchsia-500/25 to-pink-500/25 border border-fuchsia-400/45 font-mono shadow-[0_0_12px_rgba(217,70,239,0.25)]">
                  No tasks due today
                </span>
              ) : (
                <span className="text-[11px] font-extrabold text-fuchsia-200 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/25 via-fuchsia-500/25 to-pink-500/25 border border-fuchsia-400/45 font-mono shadow-[0_0_12px_rgba(217,70,239,0.25)]">
                  Complete {dailyGoal} {dailyGoal === 1 ? 'task' : 'tasks'}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium flex items-center gap-1.5">
              <CalendarCheck className="w-3 h-3 text-fuchsia-500/70 shrink-0" />
              Automatically tracks tasks due today
            </p>
          </div>
        </div>
      </div>

      {/* Progress Stats & Percentage */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm pt-1">
        <div className="flex items-center gap-2 text-slate-200 font-bold min-w-0">
          <span className="text-slate-400 font-medium">Progress:</span>
          <span
            id="daily-goal-progress-text"
            className="font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-fuchsia-300 to-pink-300 font-black text-sm sm:text-base drop-shadow-[0_1px_8px_rgba(217,70,239,0.4)]"
          >
            {tasksCompletedToday} / {dailyGoal}
          </span>
          <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
            {tasksCompletedToday === 1
              ? '1 task completed today'
              : `${tasksCompletedToday} tasks completed today`}
          </span>
        </div>

        <span
          id="daily-goal-percentage"
          className="font-black text-fuchsia-200 font-mono text-xs sm:text-sm bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-pink-500/20 border border-fuchsia-400/40 px-3.5 py-1 rounded-xl shadow-[0_0_10px_rgba(217,70,239,0.25)] shrink-0"
        >
          {percentage}%
        </span>
      </div>

      {/* Progress Bar with Leading Edge Glow */}
      <div
        id="daily-goal-progress-track"
        className="w-full h-4 bg-[#07050e] border border-fuchsia-500/25 rounded-full overflow-hidden relative shadow-[inset_0_2px_6px_rgba(0,0,0,0.95)] p-0.5"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Today's task goal progress"
      >
        <div
          id="daily-goal-progress-fill"
          className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-400 rounded-full transition-all duration-600 ease-out shadow-[0_0_20px_rgba(217,70,239,0.6),inset_0_1px_0_rgba(255,255,255,0.5)] relative overflow-visible"
          style={{ width: dailyGoal === 0 ? '0%' : `${fillWidth}%` }}
        >
          {fillWidth > 2 && (
            <span className="progress-glow-tip" style={{ background: '#f472b6', boxShadow: '0 0 12px #d946ef' }} />
          )}
        </div>
      </div>

      {/* Empty state: no tasks due today */}
      {dailyGoal === 0 && !loading && (
        <div
          id="daily-goal-empty"
          className="flex items-center gap-3 text-xs text-fuchsia-300/70 font-medium bg-fuchsia-500/08 border border-fuchsia-500/20 rounded-2xl px-4 py-3"
        >
          <CalendarCheck className="w-4 h-4 text-fuchsia-400/60 shrink-0" />
          <span>
            Add a task with <strong className="text-fuchsia-300 font-bold">today's date</strong> as its due date to see your goal appear here automatically.
          </span>
        </div>
      )}

      {/* Celebratory Message when goal is completed with Pulse Glow */}
      {isGoalReached && (
        <div
          id="daily-goal-celebration"
          className="animate-celebratePulse bg-gradient-to-r from-purple-600/25 via-fuchsia-600/25 to-pink-600/25 border border-fuchsia-400/50 rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-lg shadow-fuchsia-500/20"
        >
          <div className="flex items-center gap-3 text-fuchsia-200 font-black text-xs sm:text-sm">
            <span className="text-2xl animate-bounce">🎉</span>
            <div className="flex flex-col">
              <span className="tracking-wide text-white font-black">Daily goal completed!</span>
              <span className="text-[11px] text-fuchsia-300/90 font-medium">You smashed your target for today!</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-fuchsia-200 font-extrabold bg-fuchsia-500/25 border border-fuchsia-400/40 px-3 py-1.5 rounded-xl shadow-md">
            <Sparkles className="w-4 h-4 text-fuchsia-300 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Target Achieved!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyGoalProgress;
