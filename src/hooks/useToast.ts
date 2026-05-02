/**
 * 전역 토스트 알림 시스템 (4-9)
 * 모듈 레벨 싱글턴 — 어느 컴포넌트에서나 show/hide 가능
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l([...toasts]);
}

export const toastStore = {
  subscribe(l: Listener): () => void {
    listeners.add(l);
    l([...toasts]);
    return () => { listeners.delete(l); };
  },

  show(message: string, type: ToastType = 'success', duration = 3000) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    toasts = [...toasts, { id, message, type }];
    notify();
    if (duration > 0) {
      setTimeout(() => toastStore.dismiss(id), duration);
    }
    return id;
  },

  dismiss(id: string) {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  },
};

/** 편의 함수 */
export const toast = {
  success: (msg: string, ms?: number) => toastStore.show(msg, 'success', ms),
  error:   (msg: string, ms?: number) => toastStore.show(msg, 'error',   ms),
  info:    (msg: string, ms?: number) => toastStore.show(msg, 'info',    ms),
  warning: (msg: string, ms?: number) => toastStore.show(msg, 'warning', ms),
};
