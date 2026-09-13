import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="app-header sticky top-0 z-30 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Brand Header with Iridescent 3D Logo */}
        <div className="flex items-center gap-3.5">
          <div className="relative group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl shadow-indigo-500/30 border border-indigo-500/40 bg-black flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-1 transition-all duration-300 ring-2 ring-indigo-500/20">
              <img
                src="/3d-logo.png"
                alt="TaskBuddy 3D Logo"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Subtle glow behind logo */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 to-fuchsia-500/30 rounded-2xl blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[28px] font-black tracking-tight leading-none app-brand-text flex items-center gap-0.5">
              <span>Task</span>
              <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(236,72,153,0.4)]">
                Buddy
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs app-subtext font-semibold tracking-wide mt-0.5">
              Your friendly task workspace
            </p>
          </div>
        </div>

        {/* User profile & Theme Toggle */}
        <div className="flex items-center gap-3">
          {/* User chip */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-xs app-chip px-4 py-2 rounded-2xl border border-white/10 shadow-md shadow-black/30 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="max-w-[140px] truncate">{user.name}</span>
            </div>
          )}

          {/* 🌙/☀️ Theme Toggle */}
          <button
            type="button"
            id="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="app-icon-btn w-10 h-10 rounded-2xl flex items-center justify-center border border-white/10 shadow-md shadow-black/40 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun className="w-4.5 h-4.5 text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
