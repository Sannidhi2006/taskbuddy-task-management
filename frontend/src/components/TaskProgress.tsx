import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { type Task } from '../services/taskService';

interface TaskProgressProps {
  tasks?: Task[];
  completedCount?: number;
  totalCount?: number;
}

export const TaskProgress: React.FC<TaskProgressProps> = ({
  tasks,
  completedCount: propCompleted,
  totalCount: propTotal,
}) => {
  // Calculate live from actual tasks array if provided, otherwise fallback to props
  const total = tasks !== undefined ? tasks.length : (propTotal ?? 0);
  const completed =
    tasks !== undefined
      ? tasks.filter((t) => t.completed).length
      : (propCompleted ?? 0);

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const fillWidth = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div
      id="task-progress-section"
      className="card-3d bg-[#0d111d]/95 backdrop-blur-2xl border border-white/10 hover:border-cyan-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden shadow-xl shadow-black/60 transition-all duration-300"
    >
      {/* Subtle background aura */}
      <div className="absolute top-0 right-1/4 w-48 h-24 bg-indigo-500/08 rounded-full blur-2xl pointer-events-none -z-10" />

      {/* Progress Text Area */}
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 text-slate-100 font-bold">
          <div className="w-7 h-7 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span id="progress-text" className="tracking-wide text-sm font-bold text-white">
            {completed} of {total} tasks completed
          </span>
        </div>
        <span
          id="progress-percentage"
          className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-indigo-300 to-emerald-300 font-mono text-sm sm:text-base tracking-tight bg-[#070a12] px-3.5 py-1 rounded-xl border border-white/12 shadow-inner"
        >
          {percentage}%
        </span>
      </div>

      {/* 3D Multi-color Horizontal Progress Bar with Leading Edge Glow */}
      <div
        id="progress-bar-track"
        className="w-full h-4 bg-[#05070d] border border-white/10 rounded-full overflow-hidden relative shadow-[inset_0_2px_5px_rgba(0,0,0,0.95)] p-0.5"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Task completion progress"
      >
        <div
          id="progress-bar-fill"
          className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-600 ease-out shadow-[0_0_18px_rgba(56,189,248,0.5),inset_0_1px_0_rgba(255,255,255,0.5)] relative overflow-visible"
          style={{ width: `${fillWidth}%` }}
        >
          {fillWidth > 2 && (
            <span className="progress-glow-tip" />
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskProgress;



