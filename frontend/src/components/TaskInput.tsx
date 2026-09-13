import React, { useState } from 'react';
import { Plus, Tag, Flag, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TaskInputProps {
  onAddTask?: (task: {
    title: string;
    priority: string;
    category: string;
    dueDate?: string | null;
  }) => Promise<void> | void;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('General');
  const [dueDate, setDueDate] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setValidationError('Please enter a task.');
      toast.error('Please enter a task.');
      return;
    }

    setValidationError(null);

    if (onAddTask) {
      try {
        setIsSubmitting(true);
        await onAddTask({
          title: title.trim(),
          priority,
          category,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        });
        setTitle('');
        setDueDate('');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setTitle('');
      setDueDate('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (validationError && e.target.value.trim()) {
      setValidationError(null);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="card-3d bg-[#0d111d]/95 backdrop-blur-2xl border border-white/12 hover:border-indigo-500/35 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3 relative overflow-hidden shadow-xl shadow-black/50 transition-all duration-300"
    >
      {/* Subtle top aura */}
      <div className="absolute top-0 right-1/3 w-64 h-24 bg-cyan-500/06 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="flex flex-col gap-3">
        {/* Task Text Input - Full width & un-squished */}
        <div className="w-full relative">
          <input
            id="task-title-input"
            name="title"
            data-testid="task-title-input"
            type="text"
            value={title}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-label="Task title"
            placeholder="Enter your task..."
            className={`w-full h-12 px-4 bg-[#060810] border rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
              validationError
                ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
                : 'border-white/12 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 shadow-inner'
            }`}
          />
        </div>

        {/* Dropdowns & Button Group */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            {/* Priority Dropdown */}
            <div className="flex items-center gap-2 bg-[#060810] border border-white/12 hover:border-white/20 rounded-2xl px-3.5 h-11 text-xs text-slate-200 shrink-0 shadow-inner transition-colors">
              <Flag className="w-3.5 h-3.5 text-pink-400" />
              <label htmlFor="task-priority-select" className="text-slate-400 font-bold cursor-pointer">Priority:</label>
              <select
                id="task-priority-select"
                name="priority"
                data-testid="task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={isSubmitting}
                className="bg-transparent text-slate-100 font-extrabold focus:outline-none cursor-pointer pr-1 disabled:cursor-not-allowed"
              >
                <option value="High" className="bg-[#0f1422] text-red-400">High</option>
                <option value="Medium" className="bg-[#0f1422] text-pink-400">Medium</option>
                <option value="Low" className="bg-[#0f1422] text-cyan-400">Low</option>
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2 bg-[#060810] border border-white/12 hover:border-white/20 rounded-2xl px-3.5 h-11 text-xs text-slate-200 shrink-0 shadow-inner transition-colors">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <label htmlFor="task-category-select" className="text-slate-400 font-bold cursor-pointer">Category:</label>
              <select
                id="task-category-select"
                name="category"
                data-testid="task-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
                className="bg-transparent text-slate-100 font-extrabold focus:outline-none cursor-pointer pr-1 disabled:cursor-not-allowed"
              >
                <option value="General" className="bg-[#0f1422] text-pink-300">General</option>
                <option value="Work" className="bg-[#0f1422] text-cyan-300">Work</option>
                <option value="Personal" className="bg-[#0f1422] text-emerald-300">Personal</option>
              </select>
            </div>

            {/* Optional Due Date Picker */}
            <div className="flex items-center gap-2 bg-[#060810] border border-white/12 hover:border-white/20 rounded-2xl px-3.5 h-11 text-xs text-slate-200 shrink-0 shadow-inner focus-within:border-cyan-400 transition-colors">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <label htmlFor="task-duedate-input" className="text-slate-400 font-bold cursor-pointer">Due:</label>
              <input
                type="date"
                id="task-duedate-input"
                name="dueDate"
                data-testid="task-duedate-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting}
                className="bg-transparent text-slate-100 font-extrabold focus:outline-none cursor-pointer [color-scheme:dark] disabled:cursor-not-allowed text-xs"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  title="Clear due date"
                  className="text-slate-400 hover:text-white font-bold text-sm ml-0.5 cursor-pointer leading-none"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Add Task Button with Gradient & Soft Glow */}
          <button
            type="submit"
            id="add-task-btn"
            data-testid="add-task-btn"
            disabled={isSubmitting}
            className="btn-3d h-11 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 text-white font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-indigo-600/35 hover:shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Plus className="w-4.5 h-4.5 stroke-[3]" />
                <span>Add Task</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Form Validation Message */}
      {validationError && (
        <div className="flex items-center gap-1.5 text-red-400 text-xs font-semibold pl-1 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </form>
  );
};

export default TaskInput;



