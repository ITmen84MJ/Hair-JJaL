import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Feature Flag: Vite 빌드 시 정적으로 결정되어 트리쉐이킹됨
 * VITE_USE_SUPABASE=true 이더라도 URL·KEY 가 없으면 localStorage 모드로 자동 폴백.
 * (GitHub Actions Secret 에 VITE_USE_SUPABASE=true 만 설정하고 URL/KEY 를 생략한 경우 포함)
 */
export const USE_SUPABASE =
  import.meta.env.VITE_USE_SUPABASE === 'true' &&
  !!import.meta.env.VITE_SUPABASE_URL &&
  !!import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase 클라이언트 싱글톤 (lazy).
 *
 * - VITE_USE_SUPABASE=false (기본, 테스트 환경 포함): 빈 URL → createClient 호출 안 함
 * - VITE_USE_SUPABASE=true: 실제 Supabase 연결
 *
 * `supabase` 를 import 해도 SUPABASE 모드가 아닐 때는 실제 HTTP 요청이 발생하지 않는다.
 */
function createSupabaseClient(): SupabaseClient<Database> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!USE_SUPABASE || !url || !key) {
    // localStorage 모드 또는 테스트 환경: 더미 클라이언트 (실제 요청 없음)
    // 실제로 호출될 경우 오류가 발생하지만, USE_SUPABASE=false 이면 절대 호출되지 않는다.
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession:   true,
      autoRefreshToken: true,
      storageKey:       'hairjjal_sb_session',
    },
  });
}

export const supabase = createSupabaseClient();
