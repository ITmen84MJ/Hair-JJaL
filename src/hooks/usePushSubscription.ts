/**
 * usePushSubscription — Web Push 구독 관리 (B5)
 *
 * 원장 또는 디자이너가 "예약 알림 받기" 버튼을 클릭하면:
 * 1. 브라우저에 Push 권한 요청
 * 2. Service Worker 에서 PushSubscription 생성
 * 3. Supabase push_subscriptions 테이블에 저장
 *
 * VAPID Public Key: .env.local 의 VITE_VAPID_PUBLIC_KEY
 */

import { useState, useEffect, useCallback } from 'react';
import { USE_SUPABASE, supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

/** base64url → Uint8Array 변환 (PushManager.subscribe 에 필요) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export type PushStatus = 'idle' | 'loading' | 'subscribed' | 'denied' | 'unsupported' | 'error';

export interface UsePushSubscriptionReturn {
  status:     PushStatus;
  subscribe:  (designerId: string, shopId: string) => Promise<void>;
  unsubscribe: (designerId: string) => Promise<void>;
}

export function usePushSubscription(): UsePushSubscriptionReturn {
  const [status, setStatus] = useState<PushStatus>(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
    if (!USE_SUPABASE || !VAPID_PUBLIC_KEY) return 'unsupported';
    if (Notification.permission === 'denied') return 'denied';
    return 'idle';
  });

  // 초기 구독 상태 확인
  useEffect(() => {
    if (status === 'unsupported' || status === 'denied') return;

    navigator.serviceWorker.ready.then(async reg => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) setStatus('subscribed');
    }).catch(() => {});
  }, []);

  const subscribe = useCallback(async (designerId: string, shopId: string) => {
    if (status === 'unsupported') return;
    setStatus('loading');

    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setStatus('denied'); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!).buffer as ArrayBuffer,
      });

      if (USE_SUPABASE) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('push_subscriptions') as any)
          .upsert({
            designer_id:  designerId,
            shop_id:      shopId,
            subscription: sub.toJSON(),
          }, { onConflict: 'designer_id' });

        if (error) throw error;
      }

      setStatus('subscribed');
    } catch (e) {
      console.error('[usePushSubscription] 구독 실패:', e);
      setStatus('error');
    }
  }, [status]);

  const unsubscribe = useCallback(async (designerId: string) => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      if (USE_SUPABASE) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('designer_id', designerId);
      }

      setStatus('idle');
    } catch (e) {
      console.error('[usePushSubscription] 구독 해제 실패:', e);
    }
  }, []);

  return { status, subscribe, unsubscribe };
}
