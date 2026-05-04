import { useState, useCallback } from 'react';
import { View } from '../types';

interface NavState {
  currentView: View;
  selectedClientId: string | null;
  selectedConsultationId: string | null;
  shareToken: string | null;
}

/** 뷰 라우팅 및 선택 상태만 담당하는 훅 */
export function useNavigation() {
  const [state, setState] = useState<NavState>({
    currentView: 'dashboard',
    selectedClientId: null,
    selectedConsultationId: null,
    shareToken: null,
  });

  const navigate = useCallback((
    view: View,
    clientId?: string,
    consultationId?: string,
    token?: string,
  ) => {
    setState(s => ({
      ...s,
      currentView: view,
      selectedClientId:       clientId       ?? s.selectedClientId,
      selectedConsultationId: consultationId ?? null,
      shareToken: token ?? null,
    }));
  }, []);

  return { ...state, navigate };
}
