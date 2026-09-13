import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User as UserIcon, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side quick validations
    if (!name.trim()) {
      setError('Please provide your name');
      return;
    }
    if (!email.trim()) {
      setError('Please provide your email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsSubmitting(true);
      await register(name.trim(), email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof Error && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        setError('Something went wrong. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Multi-color ambient aura */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/12 rounded-full blur-[140px] pointer-events-none -z-10 animate-glowPulse" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/12 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/08 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header with 3D Graphic */}
        <div className="text-center space-y-3">
          <div className="inline-block relative">
            <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/40 border border-indigo-500/40 bg-black flex items-center justify-center mx-auto transform hover:scale-110 transition-transform duration-300 ring-2 ring-indigo-500/20">
              <img
                src="/3d-logo.png"
                alt="TaskBuddy 3D Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Create your <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(236,72,153,0.4)]">Account</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Get started with your collaborative task workspace
          </p>
        </div>

        {/* 3D Elevated Card */}
        <div className="card-3d bg-[#0d111d]/90 backdrop-blur-2xl border border-white/12 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl shadow-black/80">
          {error && (
            <div className="mb-5 p-3.5 bg-red-500/15 border border-red-500/40 rounded-2xl flex items-start gap-3 text-red-200 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form id="register-form" data-testid="register-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none"
              >
                Full name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 z-10">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  name="name"
                  data-testid="name-input"
                  type="text"
                  required
                  autoComplete="name"
                  aria-label="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rose"
                  className="w-full pl-10 pr-4 py-3 bg-[#07090e] border border-white/10 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner relative z-0"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none"
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 z-10">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="register-email"
                  name="email"
                  data-testid="register-email-input"
                  type="email"
                  required
                  autoComplete="email"
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#07090e] border border-white/10 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner relative z-0"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 z-10">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-password"
                  name="password"
                  data-testid="register-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  aria-label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-11 py-3 bg-[#07090e] border border-white/10 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner relative z-0"
                />
                <button
                  type="button"
                  id="toggle-register-password-visibility"
                  data-testid="toggle-register-password-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer z-10"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 pl-1">
                Must be at least 6 characters
              </p>
            </div>

            {/* Submit Button with 3D tactile press */}
            <button
              type="submit"
              id="register-submit-btn"
              data-testid="register-submit-btn"
              disabled={isSubmitting}
              className="btn-3d w-full mt-3 py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 text-white font-black rounded-2xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer relative z-0 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-4 decoration-cyan-500/40 hover:decoration-cyan-400 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;



