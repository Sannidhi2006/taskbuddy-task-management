import React, { useState, useEffect } from 'react';
import { type Task } from '../services/taskService';
import {
  RotateCcw,
  Trash2,
  Edit3,
  CheckCircle,
  Loader2,
  Calendar,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => Promise<void>;
  onUndo: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (
    id: string,
    updates: { title?: string; priority?: string; category?: string; dueDate?: string | null }
  ) => Promise<void>;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onComplete,
  onUndo,
  onDelete,
  onUpdate,
}) => {
  const taskId = task._id || task.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editCategory, setEditCategory] = useState(task.category);
  const [editDueDate, setEditDueDate] = useState<string>(
    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditCategory(task.category);
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
  }, [task]);

  const handleComplete = async () => {
    try {
      setLoadingAction(true);
      await onComplete(taskId);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUndo = async () => {
    try {
      setLoadingAction(true);
      await onUndo(taskId);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    try {
      setLoadingAction(true);
      await onUpdate(taskId, {
        title: editTitle.trim(),
        priority: editPriority,
        category: editCategory,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
      });
      setIsEditing(false);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditCategory(task.category);
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setIsEditing(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoadingAction(true);
      await onDelete(taskId);
    } finally {
      setLoadingAction(false);
      setIsConfirmingDelete(false);
    }
  };

  // Distinct Priority Tag Colors
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/35 shadow-sm shadow-rose-950/20';
      case 'Medium':
        return 'bg-pink-500/15 text-pink-300 border-pink-500/35 shadow-sm shadow-pink-950/20';
      case 'Low':
      default:
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35 shadow-sm shadow-cyan-950/20';
    }
  };

  // Calculate Due Date Status, formatting, and visual flag categories
  const getDueDateInfo = (dueDateStr?: string | null, completed?: boolean) => {
    if (!dueDateStr) return null;

    const dueDate = new Date(dueDateStr);
    if (isNaN(dueDate.getTime())) return null;

    const formatted = dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (completed) {
      return {
        formatted: `Due: ${formatted}`,
        isOverdue: false,
        isDueSoon: false,
        statusLabel: '',
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

    const msPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.round((dueDay.getTime() - today.getTime()) / msPerDay);

    const isOverdue = diffDays < 0;
    const isDueSoon = diffDays === 0 || diffDays === 1;

    let statusLabel = '';
    if (isOverdue) {
      const overdueDays = Math.abs(diffDays);
      statusLabel = overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`;
    } else if (diffDays === 0) {
      statusLabel = 'Due today';
    } else if (diffDays === 1) {
      statusLabel = 'Due tomorrow';
    }

    return {
      formatted: `Due: ${formatted}`,
      isOverdue,
      isDueSoon,
      statusLabel,
    };
  };

  const dueInfo = getDueDateInfo(task.dueDate, task.completed);

  // Inline Editing Mode (Supports changing Title, Priority, Category, and Due Date)
  if (isEditing) {
    return (
      <div className="card-3d bg-[#111420] border border-cyan-500/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3 shadow-lg shadow-cyan-950/20 min-w-0 w-full">
        <div className="flex flex-col sm:flex-row gap-2.5 flex-wrap min-w-0">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            disabled={loadingAction}
            className="flex-1 min-w-0 w-full px-4 py-2.5 bg-[#07080c] border border-white/15 rounded-xl sm:rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 shadow-inner"
            placeholder="Edit task title"
            autoFocus
          />

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
              disabled={loadingAction}
              className="flex-1 sm:flex-initial px-3 py-2.5 bg-[#07080c] border border-white/15 rounded-xl sm:rounded-2xl text-xs text-slate-200 font-bold focus:outline-none cursor-pointer disabled:cursor-not-allowed shadow-inner"
            >
              <option value="High" className="bg-[#121520] text-red-400">High</option>
              <option value="Medium" className="bg-[#121520] text-pink-400">Medium</option>
              <option value="Low" className="bg-[#121520] text-cyan-400">Low</option>
            </select>

            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              disabled={loadingAction}
              className="flex-1 sm:flex-initial px-3 py-2.5 bg-[#07080c] border border-white/15 rounded-xl sm:rounded-2xl text-xs text-slate-200 font-bold focus:outline-none cursor-pointer disabled:cursor-not-allowed shadow-inner"
            >
              <option value="General" className="bg-[#121520] text-pink-300">General</option>
              <option value="Work" className="bg-[#121520] text-cyan-300">Work</option>
              <option value="Personal" className="bg-[#121520] text-emerald-300">Personal</option>
            </select>

            {/* Optional Due Date Editor */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#07080c] border border-white/15 rounded-xl sm:rounded-2xl text-xs text-slate-200 focus-within:border-cyan-400 shadow-inner max-w-full min-w-0 flex-1 sm:flex-initial">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <label htmlFor={`edit-duedate-${taskId}`} className="text-slate-400 font-semibold cursor-pointer">Due:</label>
              <input
                id={`edit-duedate-${taskId}`}
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                disabled={loadingAction}
                className="bg-transparent text-slate-100 font-bold focus:outline-none cursor-pointer [color-scheme:dark] text-xs disabled:cursor-not-allowed min-w-0"
              />
              {editDueDate && (
                <button
                  type="button"
                  onClick={() => setEditDueDate('')}
                  title="Clear due date"
                  className="text-slate-500 hover:text-slate-300 font-bold text-sm ml-0.5 cursor-pointer leading-none"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={loadingAction}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveEdit}
            disabled={loadingAction || !editTitle.trim()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer shadow-md shadow-indigo-500/30 disabled:opacity-50 flex items-center gap-1.5"
          >
            {loadingAction && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>{loadingAction ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`card-3d card-3d-hover group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-250 gap-3 sm:gap-4 min-w-0 w-full overflow-hidden shadow-lg shadow-black/40 ${
        task.completed
          ? 'bg-[#0a0d16]/75 border-white/8 opacity-85 hover:opacity-100'
          : dueInfo?.isOverdue
          ? 'card-accent-rose bg-[#140b12]/95 backdrop-blur-md border-rose-500/40 hover:border-rose-500/60 shadow-md shadow-rose-950/40'
          : dueInfo?.isDueSoon
          ? 'card-accent-amber bg-[#131118]/95 backdrop-blur-md border-amber-500/35 hover:border-amber-500/55 shadow-md shadow-amber-950/25'
          : task.priority === 'High'
          ? 'card-accent-rose bg-[#120b14]/95 backdrop-blur-md border-rose-500/30 hover:border-rose-500/50'
          : task.priority === 'Medium'
          ? 'card-accent-pink bg-[#121118]/95 backdrop-blur-md border-pink-500/25 hover:border-pink-500/45'
          : 'card-accent-cyan bg-[#0d111d]/95 backdrop-blur-md border-cyan-500/20 hover:border-cyan-500/40'
      }`}
    >
      {/* Left section: Title, (Priority, Category), and Due Date */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {/* Custom 3D circular status toggle */}
        <div
          onClick={task.completed ? handleUndo : handleComplete}
          className={`w-6.5 h-6.5 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shrink-0 mt-0.5 sm:mt-0 ${
            task.completed
              ? 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 text-white shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-400/50 scale-105'
              : 'border-2 border-slate-500 hover:border-cyan-400 bg-white/5 hover:bg-cyan-500/15 hover:scale-110 active:scale-95 shadow-inner'
          }`}
          title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
        >
          {task.completed && <CheckCircle className="w-4 h-4 fill-transparent stroke-[3]" />}
        </div>

        <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
          <div className="flex items-baseline flex-wrap gap-2 min-w-0">
            {/* Task Title with strikethrough & reduced opacity if completed */}
            <span
              className={`text-sm sm:text-base font-bold break-words transition-all ${
                task.completed
                  ? 'line-through opacity-45 text-slate-400 decoration-slate-500 decoration-2'
                  : 'text-slate-100 font-extrabold tracking-tight'
              }`}
            >
              {task.title}
            </span>

            {/* Exact requirement: (Priority, Category) with colorful tags */}
            <span
              className={`text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full border ${getPriorityStyle(
                task.priority
              )} ${task.completed ? 'opacity-40' : ''}`}
            >
              ({task.priority}, {task.category})
            </span>
          </div>

          {/* Due date under task title if set */}
          {dueInfo && (
            <div className="mt-1 flex items-center gap-1.5 flex-wrap min-w-0">
              {dueInfo.isOverdue ? (
                /* Overdue flag: subtle red/warning indicator */
                <span
                  title={dueInfo.statusLabel}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold text-red-300 bg-red-500/15 border border-red-500/35 shadow-sm shadow-red-950/40 flex-wrap max-w-full break-words"
                >
                  <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                  <span className="break-words">{dueInfo.formatted}</span>
                  <span className="text-red-400 font-bold break-words">({dueInfo.statusLabel})</span>
                </span>
              ) : dueInfo.isDueSoon ? (
                /* Due-soon flag: subtle highlight, minimal, not loud */
                <span
                  title={dueInfo.statusLabel}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold text-amber-200 bg-amber-500/10 border border-amber-500/30 flex-wrap max-w-full break-words"
                >
                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="break-words">{dueInfo.formatted}</span>
                  <span className="text-amber-400/90 font-medium break-words">({dueInfo.statusLabel})</span>
                </span>
              ) : (
                /* Normal due date or completed */
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg flex-wrap max-w-full break-words ${
                    task.completed ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="break-words">{dueInfo.formatted}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right section: Action Buttons */}
      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
        {isConfirmingDelete ? (
          <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-500/50 px-3 py-1.5 rounded-2xl animate-fadeIn">
            <span className="text-[11px] font-bold text-red-200">Delete task?</span>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={loadingAction}
              className="text-xs font-bold text-white hover:bg-red-500/80 px-2.5 py-1 rounded-xl bg-red-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              {loadingAction && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
              <span>Yes</span>
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              disabled={loadingAction}
              className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              No
            </button>
          </div>
        ) : (
          <>
            {/* Edit Button */}
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              disabled={loadingAction}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl text-xs font-bold text-cyan-300 hover:text-white bg-cyan-950/30 hover:bg-cyan-600/30 border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Edit task"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit</span>
            </button>

            {/* Complete or Undo Button */}
            {task.completed ? (
              <button
                type="button"
                onClick={handleUndo}
                disabled={loadingAction}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-pink-300 bg-pink-950/30 hover:bg-pink-600/30 border border-pink-500/30 hover:border-pink-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loadingAction ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5 text-pink-400" />
                )}
                <span>Undo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={loadingAction}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20 active:scale-95"
              >
                {loadingAction ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                <span>Complete</span>
              </button>
            )}

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              disabled={loadingAction}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl text-xs font-bold text-red-300 hover:text-white bg-red-950/30 hover:bg-red-600/30 border border-red-500/30 hover:border-red-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Delete</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskItem;



