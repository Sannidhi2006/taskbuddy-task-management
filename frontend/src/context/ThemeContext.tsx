import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, authFetch } from '../services/api';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => Promise<void>;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Applies the theme class to <html> immediately (no flash).
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode; initialTheme?: Theme }> = ({
  children,
  initialTheme = 'dark',
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Prefer localStorage as an immediate offline cache
    const stored = localStorage.getItem('themePreference') as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    return initialTheme;
  });

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('themePreference', theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(async () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    // Apply immediately (no reload)
    setThemeState(next);

    // Persist to backend in the background
    try {
      await authFetch(`${API_BASE_URL}/users/theme`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themePreference: next }),
      });
    } catch (err) {
      console.warn('Failed to persist theme preference:', err);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
