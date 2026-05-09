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
 * - 오버레이 자체가 스크롤 컨테이너 → 콘텐츠가 뷰포트보다 길어도 스크롤 가능
 * - sticky 헤더/푸터가 오버레이 기준으로 동작
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

  // body 스크롤 잠금 (배경 페이지가 스크롤되는 것 방지)
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
    /*
     * 바깥 div: fixed 오버레이 + 스크롤 컨테이너
     * overflow-y-auto 로 콘텐츠가 길면 오버레이 안에서 스크롤됨.
     * body overflow:hidden 과 독립적으로 동작.
     */
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40"
      style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      {/*
       * 센터링 래퍼: min-h-full 로 뷰포트 높이 이상을 채워
       * 콘텐츠가 짧을 때는 수직 중앙 정렬, 길 때는 위쪽부터 자연스럽게 펼쳐짐.
       * 배경 클릭 감지는 이 div 에서.
       */}
      <div
        className="flex min-h-full items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          className={`w-full ${maxWidth} rounded-2xl outline-none my-4`}
          style={{
            backgroundColor: 'var(--bg-card)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
