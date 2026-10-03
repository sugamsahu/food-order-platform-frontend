import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api, { TOKEN_KEY, USER_KEY } from '../utils/api';
import type { StaffUser } from '../types';

type SessionUser = Pick<StaffUser, 'id' | 'name' | 'email' | 'role'>;

interface AuthContextType {
  user: SessionUser | null;
  login: (user: SessionUser, token: string) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readStoredUser = (): SessionUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw || !localStorage.getItem(TOKEN_KEY)) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.id === 'number' && (parsed.role === 'admin' || parsed.role === 'operator') ? parsed : null;
  } catch {
    return null; // corrupted storage: behave as signed out
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(() => readStoredUser());
  const [loading] = useState(false);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      toast.error('Your session has expired. Please sign in again.', { id: 'session-expired' });
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = useCallback((u: SessionUser, token: string) => {
    const session = { id: u.id, name: u.name, email: u.email, role: u.role };
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(session));
    setUser(session);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout'); // ends the session on the server too
    } catch {
      /* already expired or offline: still sign out locally */
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, isAuthenticated: !!user, isAdmin: user?.role === 'admin', loading }),
    [user, login, logout, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
