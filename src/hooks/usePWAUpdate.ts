/**
 * PWA 서비스워커 업데이트 감지 훅
 * - 새 버전이 배포되면 `needsUpdate: true` + 업데이트 함수 반환
 * - vite-plugin-pwa의 registerType: 'prompt' 모드에서 자동 활성화됨
 */
import { useState, useEffect } from 'react';

export function usePWAUpdate() {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // vite-plugin-pwa가 등록한 SW를 찾아서 업데이트 대기 감지
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return;
      setRegistration(reg);

      // 이미 waiting(업데이트 대기 중)인 경우
      if (reg.waiting) {
        setNeedsUpdate(true);
        return;
      }

      // 업데이트 감지 이벤트 리스너
      const onUpdateFound = () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setNeedsUpdate(true);
          }
        });
      };
      reg.addEventListener('updatefound', onUpdateFound);
      return () => reg.removeEventListener('updatefound', onUpdateFound);
    });

    // 컨트롤러 교체(skipWaiting 완료) 감지 → 페이지 자동 새로고침
    let refreshing = false;
    const onControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  const applyUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const dismiss = () => setNeedsUpdate(false);

  return { needsUpdate, applyUpdate, dismiss };
}
