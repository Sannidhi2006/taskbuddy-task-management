import React, { useState, useEffect } from 'react';
import { X, Flag, Tag, ArrowUpDown, RotateCcw } from 'lucide-react';

export interface FilterState {
  search: string;
  status: 'all' | 'pending' | 'completed';
  priority: 'all' | 'high' | 'medium' | 'low';
  category: 'all' | 'general' | 'work' | 'personal';
  sortBy:
    | 'newest'
    | 'oldest'
    | 'priority-high'
    | 'priority-low'
    | 'pending-first'
    | 'completed-first'
    | 'dueDate';
}

interface TaskFilterControlsProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  resultCount?: number;
}

export const TaskFilterControls: React.FC<TaskFilterControlsProps> = ({
  filters,
  onFilterChange,
  resultCount,
}) => {
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ ...filters, search: searchInput });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput, filters, onFilterChange]);

  // Sync internal state when external filter changes (e.g. reset)
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const handleClearSearch = () => {
    setSearchInput('');
    onFilterChange({ ...filters, search: '' });
  };

  const handleStatusChange = (status: FilterState['status']) => {
    onFilterChange({ ...filters, status });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, priority: e.target.value as FilterState['priority'] });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, category: e.target.value as FilterState['category'] });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, sortBy: e.target.value as FilterState['sortBy'] });
  };

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.category !== 'all' ||
    filters.sortBy !== 'newest';

  const handleResetFilters = () => {
    setSearchInput('');
    onFilterChange({
      search: '',
      status: 'all',
      priority: 'all',
      category: 'all',
      sortBy: 'newest',
    });
  };

  return (
    <div
      id="task-filter-controls"
      aria-label="Task search, filters and sort controls"
      className="card-3d bg-[#0d111d]/90 backdrop-blur-2xl border border-white/12 hover:border-white/20 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 space-y-3 shadow-xl shadow-black/40 transition-all duration-300"
    >
      {/* Row 1: Search input + Status segmented buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* 1. Search input with 300ms debounce */}
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            id="task-search-input"
            data-testid="task-search-input"
            aria-label="Search tasks"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="🔍 Search tasks..."
            className="w-full h-10 pl-3.5 pr-8 bg-[#060810] border border-white/12 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 shadow-inner transition-all font-medium"
          />
          {searchInput && (
            <button
              type="button"
              id="clear-search-btn"
              onClick={handleClearSearch}
              title="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. Status filter tabs/buttons (All / Pending / Completed) */}
        <div
          role="tablist"
          aria-label="Filter tasks by completion status"
          className="flex items-center justify-center bg-[#060810] p-1 rounded-xl border border-white/12 w-full sm:w-auto shadow-inner"
        >
          <button
            type="button"
            id="filter-status-all"
            role="tab"
            aria-selected={filters.status === 'all'}
            onClick={() => handleStatusChange('all')}
            className={`flex-1 sm:flex-initial text-center px-3.5 py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
              filters.status === 'all'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/06'
            }`}
          >
            All
          </button>
          <button
            type="button"
            id="filter-status-pending"
            role="tab"
            aria-selected={filters.status === 'pending'}
            onClick={() => handleStatusChange('pending')}
            className={`flex-1 sm:flex-initial text-center px-3.5 py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
              filters.status === 'pending'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/06'
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            id="filter-status-completed"
            role="tab"
            aria-selected={filters.status === 'completed'}
            onClick={() => handleStatusChange('completed')}
            className={`flex-1 sm:flex-initial text-center px-3.5 py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
              filters.status === 'completed'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/06'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Row 2: Priority, Category, and Sort dropdowns */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1.5 border-t border-white/5 text-xs">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {/* 3. Priority filter dropdown */}
          <div className="flex items-center gap-1.5 bg-[#06070a] border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-300 shadow-inner flex-1 sm:flex-initial min-w-[115px] max-w-full">
            <Flag className="w-3 h-3 text-pink-400 shrink-0" />
            <select
              id="filter-priority-select"
              data-testid="filter-priority-select"
              aria-label="Filter by priority"
              value={filters.priority}
              onChange={handlePriorityChange}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs pr-1 w-full"
            >
              <option value="all" className="bg-[#121520] text-slate-200">All Priorities</option>
              <option value="high" className="bg-[#121520] text-red-400">High</option>
              <option value="medium" className="bg-[#121520] text-pink-400">Medium</option>
              <option value="low" className="bg-[#121520] text-cyan-400">Low</option>
            </select>
          </div>

          {/* 4. Category filter dropdown */}
          <div className="flex items-center gap-1.5 bg-[#06070a] border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-300 shadow-inner flex-1 sm:flex-initial min-w-[115px] max-w-full">
            <Tag className="w-3 h-3 text-emerald-400 shrink-0" />
            <select
              id="filter-category-select"
              data-testid="filter-category-select"
              aria-label="Filter by category"
              value={filters.category}
              onChange={handleCategoryChange}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs pr-1 w-full"
            >
              <option value="all" className="bg-[#121520] text-slate-200">All Categories</option>
              <option value="general" className="bg-[#121520] text-pink-300">General</option>
              <option value="work" className="bg-[#121520] text-cyan-300">Work</option>
              <option value="personal" className="bg-[#121520] text-emerald-300">Personal</option>
            </select>
          </div>

          {/* 5. Sort dropdown */}
          <div className="flex items-center gap-1.5 bg-[#06070a] border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-300 shadow-inner flex-1 sm:flex-initial min-w-[130px] max-w-full">
            <ArrowUpDown className="w-3 h-3 text-indigo-400 shrink-0" />
            <select
              id="filter-sort-select"
              data-testid="filter-sort-select"
              aria-label="Sort tasks by"
              value={filters.sortBy}
              onChange={handleSortChange}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs pr-1 w-full"
            >
              <option value="newest" className="bg-[#121520] text-slate-200">Newest first</option>
              <option value="oldest" className="bg-[#121520] text-slate-200">Oldest first</option>
              <option value="priority-high" className="bg-[#121520] text-red-300">High to Low priority</option>
              <option value="priority-low" className="bg-[#121520] text-cyan-300">Low to High priority</option>
              <option value="pending-first" className="bg-[#121520] text-pink-300">Pending first</option>
              <option value="completed-first" className="bg-[#121520] text-emerald-300">Completed first</option>
              <option value="dueDate" className="bg-[#121520] text-indigo-300">Due date</option>
            </select>
          </div>
        </div>

        {/* Results summary & Reset Button */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {resultCount !== undefined && (
            <span className="text-[11px] text-slate-400 font-medium">
              {resultCount} {resultCount === 1 ? 'task' : 'tasks'}
            </span>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              id="reset-filters-btn"
              onClick={handleResetFilters}
              title="Reset all filters"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskFilterControls;
