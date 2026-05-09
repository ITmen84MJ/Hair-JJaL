import { useState, useCallback, useEffect } from 'react';
import { AuthUser } from '../types';
import { USE_SUPABASE, supabase } from '../lib/supabase';
import { demoUsers } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────────────
// 공통 상수
// ─────────────────────────────────────────────────────────────────────────────

const AUTH_KEY        = 'hairjjal_auth';
const EXTRA_USERS_KEY = 'hairjjal_extra_users';
const ATTEMPTS_KEY    = 'hairjjal_login_attempts';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8시간
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 15 * 60 * 1000; // 15분

// ─────────────────────────────────────────────────────────────────────────────
// localStorage 모드 전용 유틸
// ─────────────────────────────────────────────────────────────────────────────

async function hashPassword(email: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`hairjjal:${email.toLowerCase()}:${password}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

interface AttemptRecord { count: number; since: number }

function getAttempts(email: string): AttemptRecord {
  try {
    const map: Record<string, AttemptRecord> = JSON.parse(sessionStorage.getItem(ATTEMPTS_KEY) ?? '{}');
    return map[email] ?? { count: 0, since: Date.now() };
  } catch { return { count: 0, since: Date.now() }; }
}
function recordAttempt(email: string): AttemptRecord {
  try {
    const map: Record<string, AttemptRecord> = JSON.parse(sessionStorage.getItem(ATTEMPTS_KEY) ?? '{}');
    const prev = map[email] ?? { count: 0, since: Date.now() };
    const entry = { count: prev.count + 1, since: prev.since };
    sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify({ ...map, [email]: entry }));
    return entry;
  } catch { return { count: 1, since: Date.now() }; }
}
function clearAttempts(email: string): void {
  try {
    const map: Record<string, AttemptRecord> = JSON.parse(sessionStorage.getItem(ATTEMPTS_KEY) ?? '{}');
    delete map[email];
    sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(map));
  } catch {}
}

function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const data: AuthUser = JSON.parse(raw);
    if (data.loginAt && Date.now() - new Date(data.loginAt).getTime() > SESSION_DURATION_MS) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

function loadExtraUsers(): AuthUser[] {
  try { return JSON.parse(localStorage.getItem(EXTRA_USERS_KEY) ?? '[]'); }
  catch { return []; }
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage 구현 (기존 로직)
// ─────────────────────────────────────────────────────────────────────────────

function useLocalAuth() {
  const [user, setUser] = useState<AuthUser | null>(loadSession);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const lower = email.toLowerCase().trim();
    const rec = getAttempts(lower);
    if (rec.count >= MAX_ATTEMPTS && Date.now() - rec.since < LOCKOUT_MS) {
      const remaining = Math.ceil((LOCKOUT_MS - (Date.now() - rec.since)) / 60000);
      return `로그인 시도가 너무 많습니다. ${remaining}분 후에 다시 시도해 주세요.`;
    }
    if (rec.count >= MAX_ATTEMPTS) clearAttempts(lower);

    const candidate = [...demoUsers, ...loadExtraUsers()].find(u => u.email.toLowerCase() === lower);
    if (!candidate) { recordAttempt(lower); return '이메일 또는 비밀번호가 올바르지 않습니다.'; }

    let ok = false;
    if (candidate.passwordHash) {
      ok = (await hashPassword(lower, password)) === candidate.passwordHash;
    } else if (candidate.password) {
      ok = candidate.password === password;
    }

    if (!ok) {
      const updated = recordAttempt(lower);
      const left = MAX_ATTEMPTS - updated.count;
      if (left <= 0) return '로그인이 잠겼습니다. 15분 후에 다시 시도해 주세요.';
      if (left <= 2) return `이메일 또는 비밀번호가 올바르지 않습니다. (${left}회 남음)`;
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    }

    clearAttempts(lower);
    const { password: _pw, passwordHash: _ph, ...safe } = candidate;
    const session: AuthUser = { ...safe, loginAt: new Date().toISOString() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    setUser(session);
    return null;
  }, []);

  const loginAs = useCallback((userId: string) => {
    if (!import.meta.env.DEV) return;
    const found = [...demoUsers, ...loadExtraUsers()].find(u => u.id === userId);
    if (!found) return;
    const { password: _pw, passwordHash: _ph, ...safe } = found;
    const session: AuthUser = { ...safe, loginAt: new Date().toISOString() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    setUser(session);
  }, []);

  const addDesignerAccount = useCallback(async (data: {
    shopId: string; name: string; email: string;
    designerName: string; designerId: string; password: string;
  }): Promise<void> => {
    const lower = data.email.toLowerCase().trim();
    const all = [...demoUsers, ...loadExtraUsers()];
    if (all.some(u => u.email.toLowerCase() === lower)) return;
    const passwordHash = await hashPassword(lower, data.password);
    const extras = loadExtraUsers();
    localStorage.setItem(EXTRA_USERS_KEY, JSON.stringify([...extras, {
      id: uuidv4(), shopId: data.shopId, name: data.name,
      role: 'designer', email: lower, passwordHash,
      designerName: data.designerName, designerId: data.designerId,
    } as AuthUser]));
  }, []);

  const addOwnerAccount = useCallback(async (data: {
    shopId: string; name: string; email: string;
    password: string; designerId?: string;
  }): Promise<string | null> => {
    const lower = data.email.toLowerCase().trim();
    if ([...demoUsers, ...loadExtraUsers()].some(u => u.email.toLowerCase() === lower))
      return '이미 사용 중인 이메일입니다.';
    const passwordHash = await hashPassword(lower, data.password);
    const extras = loadExtraUsers();
    localStorage.setItem(EXTRA_USERS_KEY, JSON.stringify([...extras, {
      id: uuidv4(), shopId: data.shopId, name: data.name,
      role: 'owner', email: lower, passwordHash,
      designerName: data.name, designerId: data.designerId,
    } as AuthUser]));
    return null;
  }, []);

  const updateName = useCallback((name: string) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, name };
      localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateExtraUser = useCallback((designerId: string, data: { name?: string; email?: string }) => {
    const lowerData = data.email ? { ...data, email: data.email.toLowerCase().trim() } : data;
    const updated = loadExtraUsers().map(u =>
      u.designerId === designerId ? { ...u, ...lowerData } : u
    );
    localStorage.setItem(EXTRA_USERS_KEY, JSON.stringify(updated));
    setUser(prev => {
      if (!prev || prev.designerId !== designerId) return prev;
      const next = { ...prev, ...lowerData };
      localStorage.setItem(AUTH_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.clear();
    setUser(null);
  }, []);

  return { user, login, loginAs, logout, addDesignerAccount, addOwnerAccount, updateName, updateExtraUser };
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Auth 구현
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Supabase user_metadata 에 저장되는 앱 전용 필드
 */
interface SupabaseMeta {
  shopId:       string;
  name:         string;
  role:         string;
  designerId?:  string;
  designerName?: string;
  clientId?:    string;
}

function metaToAuthUser(id: string, email: string, meta: SupabaseMeta, loginAt?: string): AuthUser {
  return {
    id,
    email,
    shopId:       meta.shopId,
    name:         meta.name,
    role:         meta.role as AuthUser['role'],
    designerId:   meta.designerId,
    designerName: meta.designerName,
    clientId:     meta.clientId,
    loginAt:      loginAt ?? new Date().toISOString(),
  };
}

function useSupabaseAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  // 초기 세션 로드 + Auth 상태 변화 구독
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata as SupabaseMeta;
        setUser(metaToAuthUser(session.user.id, session.user.email!, meta, session.user.last_sign_in_at));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata as SupabaseMeta;
        setUser(metaToAuthUser(session.user.id, session.user.email!, meta, session.user.last_sign_in_at));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    if (error) {
      if (error.message.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
      if (error.message.includes('Email not confirmed'))       return '이메일 인증이 필요합니다. 메일함을 확인해 주세요.';
      if (error.message.includes('Too many requests'))         return '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.';
      return error.message;
    }
    // DB의 designers 테이블을 source of truth로 사용 — 메타데이터가 오래됐을 경우 동기화
    if (authData.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: designer } = await (supabase as any)
        .from('designers')
        .select('shop_id, role, id, name')
        .eq('auth_user_id', authData.user.id)
        .eq('status', 'active')
        .maybeSingle() as { data: { shop_id: string; role: string; id: string; name: string } | null };
      if (designer) {
        await supabase.auth.updateUser({
          data: {
            shopId:       designer.shop_id,
            role:         designer.role,
            designerId:   designer.id,
            name:         designer.name,
            designerName: designer.name,
          } satisfies Partial<SupabaseMeta>,
        });
      }
    }
    return null;
  }, []);

  // 개발 환경 전용: 특정 userId 로 즉시 로그인 (Supabase 모드에서는 demo 데이터만)
  const loginAs = useCallback((_userId: string) => {
    if (!import.meta.env.DEV) return;
    // Supabase 모드에서는 loginAs 미지원 (실제 이메일/비밀번호 로그인 필요)
    console.warn('[useAuth] Supabase 모드에서는 loginAs 가 지원되지 않습니다.');
  }, []);

  /**
   * 디자이너 계정 생성.
   * Supabase Auth admin.createUser() 는 서비스 키 필요 → Edge Function 경유.
   * Edge Function 미배포 시 초대 이메일 방식으로 폴백.
   */
  const addDesignerAccount = useCallback(async (data: {
    shopId: string; name: string; email: string;
    designerName: string; designerId: string; password: string;
  }): Promise<void> => {
    const lower = data.email.toLowerCase().trim();

    // Option A: Edge Function 호출 (배포된 경우)
    const { error: fnError } = await supabase.functions.invoke('create-designer-account', {
      body: {
        email:       lower,
        password:    data.password,
        shopId:      data.shopId,
        name:        data.name,
        designerName: data.designerName,
        designerId:  data.designerId,
      },
    });

    if (fnError) {
      // Option B: 폴백 — signUp(초대 이메일) 방식
      // 디자이너가 이메일로 받은 링크를 클릭해 비밀번호를 직접 설정
      await supabase.auth.signUp({
        email:    lower,
        password: data.password,
        options: {
          data: {
            shopId:       data.shopId,
            name:         data.name,
            role:         'designer',
            designerName: data.designerName,
            designerId:   data.designerId,
          } satisfies SupabaseMeta,
        },
      });
    }
  }, []);

  /**
   * 원장 계정 생성 (최초 가입 시 앱이 직접 호출).
   * Supabase signUp 사용 — 이메일 인증 링크 전송.
   */
  const addOwnerAccount = useCallback(async (data: {
    shopId: string; name: string; email: string;
    password: string; designerId?: string;
  }): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email:    data.email.toLowerCase().trim(),
      password: data.password,
      options: {
        data: {
          shopId:      data.shopId,
          name:        data.name,
          role:        'owner',
          designerName: data.name,
          designerId:  data.designerId,
        } satisfies SupabaseMeta,
      },
    });

    if (error) {
      if (error.message.includes('already registered')) return '이미 사용 중인 이메일입니다.';
      return error.message;
    }
    return null;
  }, []);

  /** 본인 이름 변경 (Supabase user_metadata 업데이트) */
  const updateName = useCallback(async (name: string) => {
    await supabase.auth.updateUser({ data: { name } });
    setUser(prev => prev ? { ...prev, name } : prev);
  }, []);

  /**
   * 디자이너 정보(이름·이메일) 변경 시 Auth 계정 동기화.
   * Supabase 모드: admin API 필요 → Edge Function 호출.
   */
  const updateExtraUser = useCallback(async (designerId: string, data: { name?: string; email?: string }) => {
    await supabase.functions.invoke('update-designer-account', {
      body: { designerId, ...data },
    }).catch(() => {
      // Edge Function 미배포 시 무시 (다음 로그인 때 metadata 재동기화)
      console.warn('[useAuth] update-designer-account Edge Function 미배포. 로컬 상태만 업데이트됩니다.');
    });

    setUser(prev => {
      if (!prev || prev.designerId !== designerId) return prev;
      return { ...prev, ...(data.name ? { name: data.name } : {}), ...(data.email ? { email: data.email } : {}) };
    });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, login, loginAs, logout, addDesignerAccount, addOwnerAccount, updateName, updateExtraUser };
}

// ─────────────────────────────────────────────────────────────────────────────
// 단일 export — Feature Flag 에 따라 구현이 결정됨
// (USE_SUPABASE 는 Vite 빌드 시 정적 상수 → 항상 같은 브랜치만 실행)
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth() {
  if (USE_SUPABASE) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSupabaseAuth();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useLocalAuth();
}
