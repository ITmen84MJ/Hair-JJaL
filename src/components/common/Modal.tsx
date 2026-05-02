import { useEffect, useRef, ReactNode } from 'react';

interface Props {
  onClose: () => void;
  /** Tailwind max-w-* 클래스. 기본값 'max-w-sm' */
  maxWidth?: string;
  children: ReactNode;
}

/**
 * 공용 모달 래퍼
 * - ESC 키로 닫기
 * - 배경 클릭으로 닫기
 * - 마운트 시 body 스크롤 잠금
 * - 자동 포커스 (접근성)
 * - role="dialog" aria-modal="true"
 */
export function Modal({ onClose, maxWidth = 'max-w-sm', children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ESC 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // body 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // 포커스 트랩 (가장 단순한 형태: 컨테이너에 포커스)
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`w-full ${maxWidth} rounded-2xl outline-none`}
        style={{
          backgroundColor: 'var(--bg-card)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
