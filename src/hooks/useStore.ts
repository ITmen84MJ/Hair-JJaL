/**
 * useStore — Facade hook
 * useDataStore(CRUD + localStorage) + useNavigation(라우팅) 을 합성합니다.
 * 기존 API를 유지하므로 App.tsx 수정 불필요.
 */
import { useDataStore } from './useDataStore';
import { useNavigation } from './useNavigation';

export function useStore() {
  const data = useDataStore();
  const nav  = useNavigation();

  return { ...data, ...nav };
}
