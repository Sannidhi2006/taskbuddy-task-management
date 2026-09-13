import React from 'react';
import { type TaskStats } from '../services/taskService';
import { ListTodo, CheckCircle2, Clock } from 'lucide-react';

interface TaskStatsCardsProps {
  stats: TaskStats;
  loading?: boolean;
}

export const TaskStatsCards: React.FC<TaskStatsCardsProps> = ({ stats, loading = false }) => {
  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <section aria-label="Task statistics overview" className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* 1. TOTAL STAT CARD */}
        <div
          id="stat-card-total"
          className="group card-3d card-3d-hover card-accent-cyan relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#0d111d]/95 backdrop-blur-2xl p-5 sm:p-6 transition-all duration-300 min-w-0 w-full cursor-default"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/12 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/22 transition-all duration-500" />

          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-cyan-300/90 font-mono">
              TOTAL
            </span>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner shrink-0">
              <ListTodo className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 sm:mt-5">
            {loading ? (
              <div className="h-10 sm:h-12 w-20 bg-white/10 rounded-2xl animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl sm:text-5xl font-black tracking-tight font-mono bg-gradient-to-br from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(56,189,248,0.2)]">
                  {stats.total}
                </span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">tasks</span>
              </div>
            )}
            <p className="text-[11px] sm:text-xs text-slate-400 mt-2 font-medium flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] shrink-0" />
              All active & completed
            </p>
          </div>
        </div>

        {/* 2. COMPLETED STAT CARD */}
        <div
          id="stat-card-completed"
          className="group card-3d card-3d-hover card-accent-emerald relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#0d111d]/95 backdrop-blur-2xl p-5 sm:p-6 transition-all duration-300 min-w-0 w-full cursor-default"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/12 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/22 transition-all duration-500" />

          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-emerald-300/90 font-mono">
              COMPLETED
            </span>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 sm:mt-5">
            {loading ? (
              <div className="h-10 sm:h-12 w-20 bg-white/10 rounded-2xl animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-4xl sm:text-5xl font-black tracking-tight font-mono bg-gradient-to-br from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(16,185,129,0.2)]">
                  {stats.completed}
                </span>
                <span className="text-xs text-emerald-300 font-extrabold bg-emerald-500/15 px-2.5 py-1 rounded-xl border border-emerald-500/30 shadow-sm">
                  {completionRate}%
                </span>
              </div>
            )}
            <p className="text-[11px] sm:text-xs text-slate-400 mt-2 font-medium flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" />
              Finished accomplishments
            </p>
          </div>
        </div>

        {/* 3. PENDING STAT CARD */}
        <div
          id="stat-card-pending"
          className="group card-3d card-3d-hover card-accent-pink relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#0d111d]/95 backdrop-blur-2xl p-5 sm:p-6 transition-all duration-300 min-w-0 w-full cursor-default"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-pink-500/12 rounded-full blur-2xl pointer-events-none group-hover:bg-pink-500/22 transition-all duration-500" />

          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-pink-300/90 font-mono">
              PENDING
            </span>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-300 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 sm:mt-5">
            {loading ? (
              <div className="h-10 sm:h-12 w-20 bg-white/10 rounded-2xl animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl sm:text-5xl font-black tracking-tight font-mono bg-gradient-to-br from-white via-slate-100 to-pink-300 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(236,72,153,0.2)]">
                  {stats.pending}
                </span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">to do</span>
              </div>
            )}
            <p className="text-[11px] sm:text-xs text-slate-400 mt-2 font-medium flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.8)] shrink-0" />
              Awaiting completion
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TaskStatsCards;
