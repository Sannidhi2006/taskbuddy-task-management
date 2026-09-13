import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User as UserIcon,
  LogOut,
  ChevronDown,
  Mail,
  Target,
  Palette,
  Calendar,
  X,
  ShieldCheck,
} from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowProfileModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const handleOpenProfile = () => {
    setIsOpen(false);
    setShowProfileModal(true);
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* User Menu Trigger Button */}
        <button
          type="button"
          id="user-menu-button"
          aria-haspopup="true"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-[#0f121d] hover:bg-[#161a29] border border-white/10 hover:border-indigo-500/40 text-slate-200 transition-all duration-200 cursor-pointer shadow-md shadow-black/40 group focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          {/* Avatar Icon / Initial */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-xs sm:text-sm font-black shadow-inner shadow-white/30 border border-white/20 shrink-0">
            {initials}
          </div>

          <span className="text-xs sm:text-sm font-semibold max-w-[100px] sm:max-w-[140px] truncate text-slate-100 hidden xs:inline">
            {user?.name || 'Account'}
          </span>

          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-cyan-400' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            id="user-dropdown-menu"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu-button"
            className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0f121d]/95 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/90 py-2 z-50 animate-fadeIn"
          >
            {/* Header info */}
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-xs font-medium text-slate-400">Signed in as</p>
              <p className="text-sm font-bold text-white truncate mt-0.5">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
            </div>

            {/* Menu options */}
            <div className="py-1">
              <button
                type="button"
                id="menu-profile-option"
                role="menuitem"
                onClick={handleOpenProfile}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
              >
                <UserIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Profile</span>
              </button>

              <button
                type="button"
                id="menu-logout-option"
                role="menuitem"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm font-medium text-red-300 hover:text-red-100 hover:bg-red-500/20 transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-red-400 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal Dialog */}
      {showProfileModal && (
        <div
          id="profile-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="card-3d bg-[#0f121d] border border-white/15 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl shadow-black/90 space-y-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Avatar & Close Button */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-indigo-500/30 border border-white/20">
                  {initials}
                </div>
                <div>
                  <h3 id="profile-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
                    {user?.name}
                    <span title="Verified Account">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-500" />
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="close-profile-modal"
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Attributes Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-[#141824] p-3.5 rounded-2xl border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Target className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Daily Goal</span>
                </div>
                <p className="text-base font-bold text-slate-100">
                  {user?.dailyGoal ?? 5} tasks / day
                </p>
              </div>

              <div className="bg-[#141824] p-3.5 rounded-2xl border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Theme</span>
                </div>
                <p className="text-base font-bold text-slate-100 capitalize">
                  {user?.themePreference ?? 'Dark'} Mode
                </p>
              </div>

              <div className="col-span-2 bg-[#141824] p-3.5 rounded-2xl border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Member Since</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-200">
                  {memberSince}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer py-1.5 px-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserMenu;
