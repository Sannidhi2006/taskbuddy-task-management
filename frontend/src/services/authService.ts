import { API_BASE_URL, authFetch } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  dailyGoal?: number;
  themePreference?: 'dark' | 'light';
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

const API_BASE = `${API_BASE_URL}/auth`;

/**
 * Register a new account
 */
export const register = async (name: string, email: string, password: string): Promise<User> => {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send & receive httpOnly cookies
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Registration failed');
  }

  return data.user;
};

/**
 * Log in to an existing account
 */
export const login = async (email: string, password: string): Promise<User> => {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Invalid email or password');
  }

  return data.user;
};

/**
 * Log out and clear session cookie
 */
export const logout = async (): Promise<void> => {
  const res = await authFetch(`${API_BASE}/logout`, {
    method: 'POST',
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Logout failed');
  }
};

/**
 * Fetch current authenticated user's profile
 */
export const getMe = async (): Promise<User> => {
  const res = await authFetch(`${API_BASE}/me`, {
    method: 'GET',
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Session expired or unauthenticated');
  }

  return data.user;
};
