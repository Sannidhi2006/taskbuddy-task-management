import React from 'react';
import {
  CheckCircle2,
  Flame,
  Layers,
  Calendar,
  RotateCw,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import { type AnalyticsData } from '../services/taskService';

interface AnalyticsViewProps {
  data: AnalyticsData | null;
  loading: boolean;
  onRefresh: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ data, loading, onRefresh }) => {
  if (loading && !data) {
    return (
      <div className="card-3d bg-[#0d0f17]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center space-y-4 animate-fadeIn">
        <RotateCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-300">Loading your analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card-3d bg-[#0d0f17]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center space-y-3">
        <p className="text-sm text-slate-400">Unable to load analytics data right now.</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Find max count for weekly bar scaling
  const maxWeeklyCount = Math.max(1, ...data.weeklyBreakdown.map((d) => d.count));

  // Determine current day for highlighting
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  return (
    <div id="analytics-view-container" className="space-y-6 animate-fadeIn">
      {/* Header & Refresh Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Productivity Overview
            </h3>
            <p className="text-xs text-slate-400">
              Clear insights on your tasks, momentum, and weekly habits
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh analytics"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/05 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Task Completion */}
        <div className="card-3d card-accent-emerald bg-[#0d111d]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Completion Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-emerald-300 to-teal-200">
                {data.completionRate}%
              </span>
              <span className="text-xs text-slate-400 font-semibold font-mono">
                ({data.completedTasks}/{data.totalTasks})
              </span>
            </div>
            <div className="w-full h-2 bg-[#06070a] rounded-full overflow-hidden mt-2.5 border border-white/08 relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 rounded-full transition-all duration-500 relative"
                style={{ width: `${data.completionRate}%` }}
              >
                {data.completionRate > 5 && <div className="progress-glow-tip" />}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            {data.pendingTasks} {data.pendingTasks === 1 ? 'task' : 'tasks'} remaining
          </p>
        </div>

        {/* Card 2: Streak */}
        <div className="card-3d card-accent-amber bg-[#0d111d]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Consistency Streak</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-300">
              {data.currentStreak} {data.currentStreak === 1 ? 'Day' : 'Days'}
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              Personal best:{' '}
              <strong className="text-amber-300 font-bold">{data.bestStreak} days</strong>
            </p>
          </div>
          <p className="text-[11px] text-slate-400">
            {data.currentStreak > 0 ? 'Active streak maintained' : 'No active streak'}
          </p>
        </div>

        {/* Card 3: Total Tasks */}
        <div className="card-3d card-accent-purple bg-[#0d111d]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Total Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-indigo-300 to-pink-300">
              {data.totalTasks}
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              All created tasks
            </p>
          </div>
          <p className="text-[11px] text-slate-400">
            {data.completedTasks} completed · {data.pendingTasks} pending
          </p>
        </div>

        {/* Card 4: Task Habits */}
        <div className="card-3d card-accent-cyan bg-[#0d111d]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl shadow-black/40 min-w-0">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Habits & Priorities</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-slate-400 shrink-0">Top Category:</span>
              <span className="font-bold text-cyan-300 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-[11px] truncate max-w-[120px]">
                {data.mostUsedCategory}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-slate-400 shrink-0">Top Priority:</span>
              <span className="font-bold text-indigo-300 px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-[11px] truncate max-w-[120px]">
                {data.mostCommonPriority}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Based on your active tasks
          </p>
        </div>
      </div>

      {/* Today vs This Week Highlight Banner */}
      <div className="card-3d bg-gradient-to-r from-indigo-950/40 via-[#0d111d] to-pink-950/40 border border-white/12 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-around gap-4 text-center min-w-0 shadow-xl shadow-black/40">
        <div className="flex items-center justify-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-300 shrink-0 shadow-inner">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs text-slate-400 font-medium">Tasks Completed Today</div>
            <div className="text-xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-rose-300 to-fuchsia-300">
              {data.tasksCompletedToday}
            </div>
          </div>
        </div>

        <div className="hidden sm:block w-px h-8 bg-white/10" />

        <div className="flex items-center justify-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 shadow-inner">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs text-slate-400 font-medium">Tasks Completed This Week</div>
            <div className="text-xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-cyan-300">
              {data.tasksCompletedThisWeek}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Breakdown (Monday through Sunday) */}
      <div className="card-3d bg-[#0d111d]/95 backdrop-blur-xl border border-white/12 rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-5 overflow-hidden min-w-0 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Weekly Completion Breakdown</span>
              <span className="text-[10px] text-cyan-300 font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 font-semibold">
                Mon – Sun
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Daily tasks completed during the current week
            </p>
          </div>
        </div>

        {/* Bar Chart Row */}
        <div className="grid grid-cols-7 gap-1 sm:gap-3 pt-4 items-end min-h-[160px] pb-2">
          {data.weeklyBreakdown.map((item) => {
            const isToday = item.date === todayStr;
            const barHeightPercent =
              item.count > 0 ? Math.max(18, Math.round((item.count / maxWeeklyCount) * 100)) : 6;

            return (
              <div key={item.date} className="flex flex-col items-center gap-2 group min-w-0">
                {/* Count Pill */}
                <span
                  className={`text-[11px] sm:text-xs font-mono font-bold transition-all ${
                    isToday
                      ? 'text-pink-300 font-black scale-110 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                      : item.count > 0
                      ? 'text-cyan-300 font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  {item.count}
                </span>

                {/* Vertical Bar */}
                <div
                  className={`w-full max-w-[28px] sm:max-w-[42px] h-28 sm:h-32 bg-[#06070a] rounded-xl border flex items-end p-1 shadow-inner relative overflow-hidden transition-all ${
                    isToday
                      ? 'border-pink-400/50 shadow-[0_0_15px_rgba(236,72,153,0.25)]'
                      : 'border-white/08 hover:border-white/20'
                  }`}
                >
                  <div
                    className={`w-full rounded-lg transition-all duration-500 ease-out ${
                      isToday
                        ? 'bg-gradient-to-t from-pink-500 via-rose-500 to-fuchsia-400 shadow-[0_0_14px_rgba(236,72,153,0.5)]'
                        : item.count > 0
                        ? 'bg-gradient-to-t from-blue-600 via-indigo-500 to-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-white/05'
                    }`}
                    style={{ height: `${barHeightPercent}%` }}
                  />
                </div>

                {/* Day Label & Today Indicator */}
                <div className="text-center">
                  <div
                    className={`text-[10px] sm:text-xs font-bold transition-colors ${
                      isToday ? 'text-pink-300 font-black' : 'text-slate-400 group-hover:text-white'
                    }`}
                  >
                    {item.day}
                  </div>
                  {isToday && (
                    <span className="inline-block text-[8px] sm:text-[9px] font-black text-pink-400 tracking-wider uppercase">
                      Today
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
