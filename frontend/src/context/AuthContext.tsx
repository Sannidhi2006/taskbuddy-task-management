import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User, getMe, login as apiLogin, register as apiRegister, logout as apiLogout } from '../services/authService';
import { AUTH_EXPIRED_EVENT } from '../services/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const currentUser = await getMe();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleAuthExpired = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      setUser(null);
      toast.error(customEvent.detail?.message || 'Session has expired. Please log in again.');
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const loggedUser = await apiLogin(email, password);
    setUser(loggedUser);
  };

  const register = async (name: string, email: string, password: string) => {
    const newUser = await apiRegister(name, email, password);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
