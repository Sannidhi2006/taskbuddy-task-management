export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AUTH_EXPIRED_EVENT = 'taskbuddy:auth-expired';

export const triggerAuthExpired = (message?: string) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(AUTH_EXPIRED_EVENT, {
        detail: { message: message || 'Session has expired. Please log in again.' },
      })
    );
  }
};

/**
 * Standard fetch wrapper that automatically handles credentials and triggers
 * graceful redirection to login when a 401 Unauthorized status is received.
 */
export const authFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const options: RequestInit = {
    ...init,
    credentials: 'include',
  };

  const response = await fetch(input, options);

  if (response.status === 401) {
    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.includes('/login') &&
      !window.location.pathname.includes('/register')
    ) {
      triggerAuthExpired('Session has expired. Please log in again.');
    }
  }

  return response;
};

export interface HealthResponse {
  status: string;
  app: string;
  motto: string;
  timestamp: string;
  uptime: string;
  database: {
    status: string;
  };
}

export const checkHealth = async (): Promise<HealthResponse> => {
  const res = await authFetch(`${API_BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status: ${res.status}`);
  }
  return res.json();
};
