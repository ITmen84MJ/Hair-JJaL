import { useState, useCallback, useEffect } from 'react';
import { AuthUser } from '../types';
import { USE_SUPABASE, supabase } from '../lib/supabase';
import { demoUsers } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';
import { toast } from './useToast';

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

    if (candidate.disabled) return '이 계정은 비활성화되었습니다. 관리자에게 문의해 주세요.';

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

  /** 고객 계정 생성 — localStorage 모드에서도 지원 (clientId는 호출 측에서 먼저 생성 후 전달) */
  const addCustomerAccount = useCallback(async (data: {
    shopId: string; name: string; phone: string; email: string; password: string; clientId?: string;
  }): Promise<string | null> => {
    const lower = data.email.toLowerCase().trim();
    if ([...demoUsers, ...loadExtraUsers()].some(u => u.email.toLowerCase() === lower))
      return '이미 사용 중인 이메일입니다.';
    const passwordHash = await hashPassword(lower, data.password);
    const clientId = data.clientId ?? uuidv4();
    const extras = loadExtraUsers();
    localStorage.setItem(EXTRA_USERS_KEY, JSON.stringify([...extras, {
      id: uuidv4(), shopId: data.shopId, name: data.name,
      role: 'customer', email: lower, passwordHash, clientId,
    } as AuthUser]));
    return null;
  }, []);

  /**
   * 비밀번호 재설정 1단계 — 이름+이메일 일치 확인.
   * localStorage 모드: 일치하면 null(성공) 반환 → LoginPage에서 새 비밀번호 입력 단계로 진입.
   */
  const resetPassword = useCallback(async (email: string, name: string): Promise<string | null> => {
    const lower = email.toLowerCase().trim();
    const lowerName = name.trim().toLowerCase();
    const found = [...demoUsers, ...loadExtraUsers()].find(
      u => u.email.toLowerCase() === lower && u.name.trim().toLowerCase() === lowerName
    );
    if (!found) return '이메일 또는 이름이 일치하는 계정이 없습니다.';
    return null; // 인증 성공 → LoginPage가 새 비밀번호 입력 단계를 표시
  }, []);

  /**
   * 비밀번호 재설정 2단계 — 새 비밀번호 저장 (기존 비밀번호 확인 없음, reset 전용).
   * extraUsers 에서 이메일 일치 계정의 passwordHash 를 교체.
   */
  const setNewPassword = useCallback(async (email: string, newPassword: string): Promise<string | null> => {
    const lower = email.toLowerCase().trim();
    if (newPassword.length < 6) return '비밀번호는 6자 이상이어야 합니다.';
    const newHash = await hashPassword(lower, newPassword);
    const extras = loadExtraUsers();
    const idx = extras.findIndex(u => u.email.toLowerCase() === lower);
    if (idx === -1) return '계정을 찾을 수 없습니다. 처음부터 다시 시도해 주세요.';
    extras[idx] = { ...extras[idx], passwordHash: newHash };
    localStorage.setItem(EXTRA_USERS_KEY, JSON.stringify(extras));
    return null;
  }, []);

  /** 비밀번호 변경 — 현재 로그인된 사용자 (현재 비밀번호 확인 포함) */
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<string | null> => {
    if (!user) return '로그인이 필요합니다.';
    // 현재 비밀번호 검증
    const candidate = [...demoUsers, ...loadExtraUsers()].find(
      u => u.email.toLowerCase() === user.email.toLowerCase()
    );
    if (candidate) {
      let currentOk = false;
      if (candidate.passwordHash) {
        currentOk = (await hashPassword(user.email.toLowerCase(), currentPassword)) === candidate.passwordHash;
      } else if (candidate.password) {
        currentOk = candidate.password === currentPassword;
      }
      if (!currentOk) return '현재 비밀번호가 올바르지 않습니다.';
    }
    const newHash = await hashPassword(user.email.toLowerCase(), newPassword);
    const extras = loadExtraUsers().map(u =>
      u.email.toLowerCase() === user.email.toLowerCase() ? { ...u, passwordHash: newHash } : u
    );
    localStorage.setItem(EXTRA_USERS_KEY, JSON.stringify(extras));
    return null;
  }, [user]);

  /** 디자이너 계정 비활성화 (퇴직 처리) */
  const disableDesignerAccount = useCallback((designerId: string) => {
    const extras = loadExtraUsers().map(u =>
      u.designerId === designerId ? { ...u, disabled: true } : u
    );
    localStorage.setItem(EXTRA_USERS_KEY, JSON.stringify(extras));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.clear();
    setUser(null);
  }, []);

  return {
    user, login, loginAs, logout,
    addDesignerAccount, addOwnerAccount, addCustomerAccount,
    updateName, updateExtraUser, resetPassword, setNewPassword, changePassword,
    disableDesignerAccount,
  };
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

  /**
   * 데모 계정으로 즉시 로그인.
   * Supabase 모드에서는 실제 signInWithPassword 를 호출하므로
   * seed-demo Edge Function 으로 계정이 미리 생성되어 있어야 한다.
   */
  const loginAs = useCallback(async (userId: string) => {
    const demo = demoUsers.find(u => u.id === userId);
    if (!demo?.email || !demo?.password) return;
    const { error } = await supabase.auth.signInWithPassword({
      email:    demo.email,
      password: demo.password,
    });
    if (error) {
      console.error('[loginAs] 데모 계정 로그인 실패:', error.message);
      toast.error('데모 계정 로그인에 실패했습니다. Supabase에 데모 데이터가 아직 생성되지 않았을 수 있습니다.');
    }
  }, []);

  /**
   * 디자이너 계정 생성.
   * Supabase Auth admin.createUser() 는 서비스 키 필요 → Edge Function 경유.
   * AUTH-04: signUp() 폴백 제거 — 중복 계정 생성 및 이메일 확인 대기 문제 방지.
   * Edge Function 미배포 환경에서는 "기존 계정 연결(search_unassigned_users)" 방식 사용.
   */
  const addDesignerAccount = useCallback(async (data: {
    shopId: string; name: string; email: string;
    designerName: string; designerId: string; password: string;
  }): Promise<void> => {
    const lower = data.email.toLowerCase().trim();

    const { error: fnError } = await supabase.functions.invoke('create-designer-account', {
      body: {
        email:        lower,
        password:     data.password,
        shopId:       data.shopId,
        name:         data.name,
        designerName: data.designerName,
        designerId:   data.designerId,
      },
    });

    if (fnError) {
      // Edge Function 미배포 — 관리자가 별도로 Auth 계정을 생성해야 함
      // (signUp 폴백 제거: 이메일 미확인 계정이 생성되어 로그인 불가 → 혼란 야기)
      console.warn('[addDesignerAccount] create-designer-account Edge Function 미배포:', fnError.message);
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

  /**
   * AUTH-05: 고객 계정 생성 + client 레코드 생성/연결.
   * 1. supabase.auth.signUp() 으로 Auth 계정 생성
   * 2. register_customer() RPC 로 clients 테이블에 레코드 생성 및 auth_user_id 연결
   */
  const addCustomerAccount = useCallback(async (data: {
    shopId: string;
    name:   string;
    phone:  string;
    email:  string;
    password: string;
  }): Promise<string | null> => {
    const lower = data.email.toLowerCase().trim();

    // 1. Auth 계정 생성 (이메일 확인 없이 즉시 로그인 가능 — Supabase 프로젝트 설정에 따름)
    const { data: authData, error } = await supabase.auth.signUp({
      email:    lower,
      password: data.password,
      options: {
        data: {
          name:   data.name,
          role:   'customer',
          shopId: data.shopId,
        } satisfies Partial<SupabaseMeta>,
      },
    });

    if (error) {
      if (error.message.includes('already registered')) return '이미 사용 중인 이메일입니다.';
      return error.message;
    }

    // 2. client 레코드 생성 / 기존 레코드 연결
    if (authData.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rpcError } = await (supabase as any).rpc('register_customer', {
        p_shop_id: data.shopId,
        p_name:    data.name,
        p_phone:   data.phone,
        p_email:   lower,
      });
      if (rpcError) {
        console.error('[addCustomerAccount] register_customer RPC 오류:', rpcError);
        return '고객 정보 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.';
      }
    }

    return null;
  }, []);

  /**
   * 비밀번호 재설정 이메일 발송.
   * 이름+이메일 일치 확인(verify_reset_identity RPC) 후 재설정 링크 발송.
   */
  const resetPassword = useCallback(async (email: string, name: string): Promise<string | null> => {
    const lower = email.toLowerCase().trim();
    const lowerName = name.trim();

    // 1. 이름+이메일 일치 확인 (SECURITY DEFINER RPC)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: matched, error: rpcError } = await (supabase as any).rpc('verify_reset_identity', {
        p_email: lower,
        p_name:  lowerName,
      });
      if (rpcError) {
        // RPC 미배포 환경 — 이메일만으로 발송 (폴백)
        console.warn('[resetPassword] verify_reset_identity RPC 미배포. 이메일만으로 발송합니다.');
      } else if (!matched) {
        return '이메일 또는 이름이 일치하는 계정이 없습니다. 다시 확인해 주세요.';
      }
    } catch {
      // 네트워크 오류 등 — 폴백으로 그냥 발송
    }

    // 2. 재설정 링크 이메일 발송
    const { error } = await supabase.auth.resetPasswordForEmail(lower, {
      redirectTo: window.location.origin + '/',
    });
    if (error) return error.message;
    return null;
  }, []);

  /** 현재 로그인된 사용자의 비밀번호 변경 (현재 비밀번호 확인 포함) */
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<string | null> => {
    if (!user) return '로그인이 필요합니다.';
    // 현재 비밀번호 검증 — Supabase updateUser 는 old password 를 검증하지 않으므로 재로그인으로 확인
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) return '현재 비밀번호가 올바르지 않습니다.';
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return error.message;
    return null;
  }, [user]);

  /** 디자이너 계정 비활성화 (퇴직 처리) — Edge Function 경유 (미배포 시 무시) */
  const disableDesignerAccount = useCallback(async (designerId: string) => {
    await supabase.functions.invoke('update-designer-account', {
      body: { designerId, disabled: true },
    }).catch(() => {
      console.warn('[useAuth] update-designer-account Edge Function 미배포. 계정 비활성화를 건너뜁니다.');
    });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  // Supabase 모드에서는 이메일 링크로 재설정 → setNewPassword 불필요
  const setNewPassword = useCallback(async (_email: string, _newPassword: string): Promise<string | null> => null, []);

  return {
    user, login, loginAs, logout,
    addDesignerAccount, addOwnerAccount, addCustomerAccount,
    updateName, updateExtraUser, resetPassword, setNewPassword, changePassword,
    disableDesignerAccount,
  };
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
