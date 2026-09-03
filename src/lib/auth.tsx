import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken } from './api';
import type { Student } from './types';

export type Role = 'admin' | 'student';
export interface AdminUser {
  id: number;
  username: string;
  name: string;
}

interface AuthState {
  role: Role | null;
  user: Student | AdminUser | null;
  loading: boolean;
  login: (role: Role, username: string, password: string) => Promise<Role>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  role: null,
  user: null,
  loading: true,
  login: async () => 'student',
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<Student | AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setRole(null);
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api<{ role: Role; user: Student | AdminUser }>('/api/auth');
      setRole(data.role);
      setUser(data.user);
    } catch {
      setToken(null);
      setRole(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (r: Role, username: string, password: string) => {
    const data = await api<{ token: string; role: Role; user: Student | AdminUser }>('/api/auth', {
      method: 'POST',
      body: { action: 'login', role: r, username, password },
    });
    setToken(data.token);
    setRole(data.role);
    setUser(data.user);
    return data.role;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/api/auth', { method: 'POST', body: { action: 'logout' } });
    } catch {
      /* ignore */
    }
    setToken(null);
    setRole(null);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ role, user, loading, login, logout, refresh }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
