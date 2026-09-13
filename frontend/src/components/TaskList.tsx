import React from 'react';
import { TaskItem } from './TaskItem';
import { type Task } from '../services/taskService';

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  onComplete: (id: string) => Promise<void>;
  onUndo: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (
    id: string,
    updates: { title?: string; priority?: string; category?: string; dueDate?: string | null }
  ) => Promise<void>;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  loading = false,
  onComplete,
  onUndo,
  onDelete,
  onUpdate,
}) => {
  if (loading) {
    return (
      <div className="card-3d bg-[#0e1017]/90 border border-white/10 rounded-3xl p-8 sm:p-12 text-center animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mx-auto mb-3" />
        <div className="h-4 w-40 bg-white/10 rounded-full mx-auto mb-2" />
        <div className="h-3 w-64 bg-white/5 rounded-full mx-auto" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="card-3d bg-[#0e1017]/85 backdrop-blur-xl border border-white/10 rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-8 -left-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-cyan-500/08 rounded-full blur-3xl pointer-events-none" />

        {/* 📝 Emoji icon */}
        <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center text-5xl select-none drop-shadow-lg hover:scale-110 transition-transform duration-300 cursor-default">
          📝
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          No tasks yet!
        </h3>
        <p className="text-sm text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed">
          Add your first task and let's get things done.
        </p>

        {/* Soft call-to-action hint */}
        <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold shadow-sm">
          <span>🌱 Start small. Add your first task!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {tasks.map((task) => (
        <TaskItem
          key={task._id}
          task={task}
          onComplete={onComplete}
          onUndo={onUndo}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
};

export default TaskList;
