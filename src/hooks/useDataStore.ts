/**
 * useDataStore — Feature Flag 라우터
 *
 * VITE_USE_SUPABASE=false (기본): useLocalStore  → localStorage CRUD
 * VITE_USE_SUPABASE=true         : useSupabaseStore → Supabase CRUD + Realtime
 *
 * 두 훅이 완전히 동일한 인터페이스를 반환하므로
 * 이 파일 외부의 모든 코드(컴포넌트, useStore)는 변경이 필요 없다.
 *
 * USE_SUPABASE 는 Vite 빌드 시 정적 상수로 치환되어 트리쉐이킹됨.
 * 따라서 조건부 hook 호출은 런타임에 항상 동일한 브랜치만 실행한다.
 */
import { USE_SUPABASE } from '../lib/supabase';
import { useLocalStore, STORAGE_KEY, DATA_VERSION } from './useLocalStore';
import { useSupabaseStore } from './useSupabaseStore';

export { STORAGE_KEY, DATA_VERSION };

export function useDataStore() {
  if (USE_SUPABASE) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSupabaseStore();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useLocalStore();
}
