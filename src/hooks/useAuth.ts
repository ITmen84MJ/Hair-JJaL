import { useState, useCallback } from 'react';
import { AuthUser } from '../types';
import { demoUsers } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';

const AUTH_KEY        = 'hairjjal_auth';
const EXTRA_USERS_KEY = 'hairjjal_extra_users';
const ATTEMPTS_KEY    = 'hairjjal_login_attempts';

/** 세션 유효 시간: 8시간 */
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

/** 브루트포스 방어: 5회 실패 시 15분 잠금 */
const MAX_ATTEMPTS    = 5;
const LOCKOUT_MS      = 15 * 60 * 1000;

// ── 비밀번호 해싱 (Web Crypto API — SHA-256 + email salt) ──────────
async function hashPassword(email: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`hairjjal:${email.toLowerCase()}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── 로그인 시도 횟수 관리 ──────────────────────────────────────────
interface AttemptRecord { count: number; since: number }

function getAttempts(email: string): AttemptRecord {
  try {
    const raw = sessionStorage.getItem(ATTEMPTS_KEY);
    const map: Record<string, AttemptRecord> = raw ? JSON.parse(raw) : {};
    return map[email] ?? { count: 0, since: Date.now() };
  } catch { return { count: 0, since: Date.now() }; }
}

function recordAttempt(email: string): AttemptRecord {
  try {
    const raw = sessionStorage.getItem(ATTEMPTS_KEY);
    const map: Record<string, AttemptRecord> = raw ? JSON.parse(raw) : {};
    const prev = map[email] ?? { count: 0, since: Date.now() };
    const entry = { count: prev.count + 1, since: prev.since };
    sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify({ ...map, [email]: entry }));
    return entry;
  } catch { return { count: 1, since: Date.now() }; }
}

function clearAttempts(email: string): void {
  try {
    const raw = sessionStorage.getItem(ATTEMPTS_KEY);
    const map: Record<string, AttemptRecord> = raw ? JSON.parse(raw) : {};
    delete map[email];
    sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(map));
  } catch {}
}

// ── 세션 로드: 만료 여부 체크 ─────────────────────────────────────
function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const data: AuthUser = JSON.parse(raw);
    // 세션 만료 체크
    if (data.loginAt) {
      const elapsed = Date.now() - new Date(data.loginAt).getTime();
      if (elapsed > SESSION_DURATION_MS) {
        localStorage.removeItem(AUTH_KEY);
        return null;
      }
    }
    return data;
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

  // ── 로그인 (async: SHA-256 해싱 사용) ────────────────────────────
  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const lowerEmail = email.toLowerCase().trim();

    // 잠금 여부 확인
    const rec = getAttempts(lowerEmail);
    if (rec.count >= MAX_ATTEMPTS && Date.now() - rec.since < LOCKOUT_MS) {
      const remaining = Math.ceil((LOCKOUT_MS - (Date.now() - rec.since)) / 60000);
      return `로그인 시도가 너무 많습니다. ${remaining}분 후에 다시 시도해 주세요.`;
    }
    // 잠금 기간 지났으면 초기화
    if (rec.count >= MAX_ATTEMPTS) clearAttempts(lowerEmail);

    const allUsers = [...demoUsers, ...loadExtraUsers()];
    const candidate = allUsers.find(u => u.email.toLowerCase() === lowerEmail);

    if (!candidate) {
      recordAttempt(lowerEmail);
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    }

    let authenticated = false;

    if (candidate.passwordHash) {
      // 신규 계정: 해시 비교
      const inputHash = await hashPassword(lowerEmail, password);
      authenticated = inputHash === candidate.passwordHash;
    } else if (candidate.password) {
      // 데모 계정 또는 마이그레이션 전 계정: 평문 비교
      authenticated = candidate.password === password;
    }

    if (!authenticated) {
      const updated = recordAttempt(lowerEmail);
      const remaining = MAX_ATTEMPTS - updated.count;
      if (remaining <= 0) return '로그인이 잠겼습니다. 15분 후에 다시 시도해 주세요.';
      if (remaining <= 2) return `이메일 또는 비밀번호가 올바르지 않습니다. (${remaining}회 남음)`;
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    }

    clearAttempts(lowerEmail);

    // 세션 저장 (비밀번호·해시 제외, loginAt 포함)
    const { password: _pw, passwordHash: _ph, ...safeUser } = candidate;
    const sessionUser: AuthUser = { ...safeUser, loginAt: new Date().toISOString() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return null;
  }, []);

  // ── 개발 환경 전용 원클릭 로그인 ─────────────────────────────────
  const loginAs = useCallback((userId: string) => {
    if (!import.meta.env.DEV) return; // 프로덕션에서는 완전히 차단
    const allUsers = [...demoUsers, ...loadExtraUsers()];
    const found = allUsers.find(u => u.id === userId);
    if (!found) return;
    const { password: _pw, passwordHash: _ph, ...safeUser } = found;
    const sessionUser: AuthUser = { ...safeUser, loginAt: new Date().toISOString() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
  }, []);

  // ── 디자이너 계정 생성 (비밀번호 해시 저장) ──────────────────────
  const addDesignerAccount = useCallback(async (data: {
    shopId: string;
    name: string;
    email: string;
    designerName: string;
    designerId: string;
    password: string;
  }): Promise<void> => {
    const lowerEmail = data.email.toLowerCase().trim();
    const extras = loadExtraUsers();
    const allUsers = [...demoUsers, ...extras];
    if (allUsers.some(u => u.email.toLowerCase() === lowerEmail)) return;

    const passwordHash = await hashPassword(lowerEmail, data.password);

    const newUser: AuthUser = {
      id: uuidv4(),
      shopId: data.shopId,
      name: data.name,
      role: 'designer',
      email: lowerEmail,
      passwordHash,               // 평문 비밀번호 대신 해시 저장
      designerName: data.designerName,
      designerId: data.designerId,
    };
    localStorage.setItem(EXTRA_USERS_KEY, JSON.stringify([...extras, newUser]));
  }, []);

  // ── 본인 이름 변경 ────────────────────────────────────────────────
  const updateName = useCallback((name: string) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, name };
      localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── 디자이너 정보(이름·이메일) 변경 시 extra_users 계정 동기화 ──
  const updateExtraUser = useCallback((designerId: string, data: { name?: string; email?: string }) => {
    const lowerData = data.email ? { ...data, email: data.email.toLowerCase().trim() } : data;
    const extras = loadExtraUsers();
    const updated = extras.map(u =>
      u.designerId === designerId ? { ...u, ...lowerData } : u
    );
    localStorage.setItem(EXTRA_USERS_KEY, JSON.stringify(updated));
    setUser(prev => {
      if (!prev || prev.designerId !== designerId) return prev;
      const updatedUser = { ...prev, ...lowerData };
      localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  }, []);

  return { user, login, loginAs, logout, addDesignerAccount, updateName, updateExtraUser };
}
