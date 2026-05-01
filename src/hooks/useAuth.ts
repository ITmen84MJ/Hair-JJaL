import { useState, useCallback } from 'react';
import { AuthUser } from '../types';
import { demoUsers } from '../data/mockData';

const AUTH_KEY = 'hairjjal_auth';

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  const login = useCallback((email: string, password: string): string | null => {
    const found = demoUsers.find(u => u.email === email && u.password === password);
    if (!found) return '이메일 또는 비밀번호가 올바르지 않습니다.';
    const safe = { ...found };
    localStorage.setItem(AUTH_KEY, JSON.stringify(safe));
    setUser(safe);
    return null;
  }, []);

  const loginAs = useCallback((userId: string) => {
    const found = demoUsers.find(u => u.id === userId);
    if (!found) return;
    localStorage.setItem(AUTH_KEY, JSON.stringify(found));
    setUser(found);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  }, []);

  return { user, login, loginAs, logout };
}
