import { useState, useCallback } from 'react';
import { AuthUser } from '../types';
import { demoUsers } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';

const AUTH_KEY = 'hairjjal_auth';
// P1-6: 동적으로 추가된 디자이너 계정을 별도 키에 저장
const EXTRA_USERS_KEY = 'hairjjal_extra_users';

function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadExtraUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(EXTRA_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(loadSession);

  const login = useCallback((email: string, password: string): string | null => {
    const allUsers = [...demoUsers, ...loadExtraUsers()];
    const found = allUsers.find(u => u.email === email && u.password === password);
    if (!found) return '이메일 또는 비밀번호가 올바르지 않습니다.';
    // P1-13: 세션에 비밀번호 저장 안 함
    const { password: _pw, ...safeUser } = found;
    localStorage.setItem(AUTH_KEY, JSON.stringify(safeUser));
    setUser(safeUser as AuthUser);
    return null;
  }, []);

  const loginAs = useCallback((userId: string) => {
    const allUsers = [...demoUsers, ...loadExtraUsers()];
    const found = allUsers.find(u => u.id === userId);
    if (!found) return;
    const { password: _pw, ...safeUser } = found;
    localStorage.setItem(AUTH_KEY, JSON.stringify(safeUser));
    setUser(safeUser as AuthUser);
  }, []);

  // P1-6: 원장이 디자이너 추가 시 로그인 계정 자동 생성
  const addDesignerAccount = useCallback((data: {
    shopId: string;
    name: string;
    email: string;
    designerName: string;
    designerId: string;
    password: string;
  }) => {
    const extras = loadExtraUsers();
    // 이메일 중복 방지
    const allUsers = [...demoUsers, ...extras];
    if (allUsers.some(u => u.email === data.email)) return;
    const newUser: AuthUser = {
      id: uuidv4(),
      shopId: data.shopId,
      name: data.name,
      role: 'designer',
      email: data.email,
      password: data.password,
      designerName: data.designerName,
      designerId: data.designerId,
    };
    localStorage.setItem(EXTRA_USERS_KEY, JSON.stringify([...extras, newUser]));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  }, []);

  return { user, login, loginAs, logout, addDesignerAccount };
}
