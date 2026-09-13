import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'sonner';
import { useTheme } from './context/ThemeContext';

// Redirect logged-in users away from /login or /register
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

/**
 * Inner wrapper that reads auth user's themePreference and syncs ThemeContext
 * so the correct theme is applied on first load after login.
 */
const ThemeSyncer: React.FC = () => {
  const { user } = useAuth();
  const { setTheme } = useTheme();

  React.useEffect(() => {
    if (user?.themePreference) {
      setTheme(user.themePreference);
    }
  }, [user?.themePreference, setTheme]);

  return null;
};

// Toaster picks up theme from context
const ThemedToaster: React.FC = () => {
  const { theme } = useTheme();
  return <Toaster position="top-right" richColors theme={theme} closeButton />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemeSyncer />
        <ThemedToaster />
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Protected Main Dashboard */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
