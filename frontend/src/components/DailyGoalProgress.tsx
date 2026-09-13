import React, { useState } from 'react';
import { Target, Check, Pencil, X, Sparkles } from 'lucide-react';

interface DailyGoalProgressProps {
  dailyGoal: number;
  tasksCompletedToday: number;
  onUpdateGoal: (newGoal: number) => Promise<void>;
  loading?: boolean;
}

export const DailyGoalProgress: React.FC<DailyGoalProgressProps> = ({
  dailyGoal,
  tasksCompletedToday,
  onUpdateGoal,
  loading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [goalInput, setGoalInput] = useState(String(dailyGoal));
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const percentage =
    dailyGoal > 0 ? Math.min(100, Math.round((tasksCompletedToday / dailyGoal) * 100)) : 0;
  const fillWidth =
    dailyGoal > 0 ? Math.min(100, (tasksCompletedToday / dailyGoal) * 100) : 0;
  const isGoalReached = dailyGoal > 0 && tasksCompletedToday >= dailyGoal;

  const handleStartEdit = () => {
    setGoalInput(String(dailyGoal));
    setEditError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
    setGoalInput(String(dailyGoal));
  };

  const handleSaveGoal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseInt(goalInput, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 1000) {
      setEditError('Please enter a goal between 1 and 1000');
      return;
    }

    try {
      setIsSaving(true);
      setEditError(null);
      await onUpdateGoal(parsed);
      setIsEditing(false);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update daily goal');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="daily-goal-section"
      className="card-3d card-accent-purplish-pink bg-gradient-to-br from-[#160b24]/95 via-[#11091a]/95 to-[#0b0c16]/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden shadow-xl shadow-fuchsia-950/40 transition-all duration-300 border border-fuchsia-500/35 hover:border-fuchsia-500/55"
    >
      {/* Subtle top purplish-pink aura */}
      <div className="absolute top-0 left-1/4 w-80 h-36 bg-gradient-to-r from-purple-500/20 via-fuchsia-500/25 to-pink-500/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Row: Title, Target Description, and Edit Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/30 via-fuchsia-500/30 to-pink-500/30 border border-fuchsia-400/40 flex items-center justify-center text-fuchsia-300 shrink-0 shadow-inner shadow-fuchsia-500/20">
            <Target className="w-5 h-5 text-fuchsia-300 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Today's Goal</span>
              <span className="text-[11px] font-extrabold text-fuchsia-200 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/25 via-fuchsia-500/25 to-pink-500/25 border border-fuchsia-400/45 font-mono shadow-[0_0_12px_rgba(217,70,239,0.25)]">
                Complete {dailyGoal} {dailyGoal === 1 ? 'task' : 'tasks'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Daily completion target based on your active accomplishments
            </p>
          </div>
        </div>

        {/* Edit Goal Toggle & Form */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {!isEditing ? (
            <button
              type="button"
              id="edit-daily-goal-btn"
              onClick={handleStartEdit}
              disabled={loading}
              title="Edit daily goal number"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-fuchsia-200 hover:text-white bg-fuchsia-500/15 hover:bg-fuchsia-500/30 border border-fuchsia-400/35 hover:border-fuchsia-400/60 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Pencil className="w-3 h-3 text-fuchsia-300" />
              <span>Edit Goal</span>
            </button>
          ) : (
            <form onSubmit={handleSaveGoal} className="flex items-center gap-1.5 animate-fadeIn">
              <input
                type="number"
                id="daily-goal-input"
                min="1"
                max="1000"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                disabled={isSaving}
                className="w-18 px-3 py-1 text-xs font-bold text-white bg-[#0a0514] border border-fuchsia-500/50 rounded-xl focus:outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-500/30 text-center font-mono shadow-inner"
                autoFocus
              />
              <button
                type="submit"
                id="save-daily-goal-btn"
                disabled={isSaving}
                title="Save daily goal"
                className="p-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 hover:from-purple-500 hover:via-fuchsia-500 hover:to-pink-400 text-white font-black transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-fuchsia-500/30"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
              <button
                type="button"
                id="cancel-daily-goal-btn"
                onClick={handleCancelEdit}
                disabled={isSaving}
                title="Cancel"
                className="p-1.5 rounded-xl bg-white/08 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {editError && (
        <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl animate-fadeIn">
          {editError}
        </div>
      )}

      {/* Progress Stats & Percentage */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm pt-1">
        <div className="flex items-center gap-2 text-slate-200 font-bold min-w-0">
          <span className="text-slate-400 font-medium">Progress:</span>
          <span id="daily-goal-progress-text" className="font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-fuchsia-300 to-pink-300 font-black text-sm sm:text-base drop-shadow-[0_1px_8px_rgba(217,70,239,0.4)]">
            {tasksCompletedToday} / {dailyGoal}
          </span>
          <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
            ({tasksCompletedToday === 1 ? '1 task completed today' : `${tasksCompletedToday} tasks completed today`})
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
        aria-label="Daily task goal progress"
      >
        <div
          id="daily-goal-progress-fill"
          className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-400 rounded-full transition-all duration-600 ease-out shadow-[0_0_20px_rgba(217,70,239,0.6),inset_0_1px_0_rgba(255,255,255,0.5)] relative overflow-visible"
          style={{ width: `${fillWidth}%` }}
        >
          {fillWidth > 2 && (
            <span className="progress-glow-tip" style={{ background: '#f472b6', boxShadow: '0 0 12px #d946ef' }} />
          )}
        </div>
      </div>

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
