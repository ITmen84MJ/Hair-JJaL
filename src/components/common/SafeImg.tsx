import { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** 이미지 로드 실패 시 표시할 영역의 추가 클래스 (img className과 동일하게 사용) */
  fallbackClassName?: string;
}

/**
 * P3-28: 이미지 로드 실패 시 깨진 이미지 대신 placeholder 표시
 */
export function SafeImg({ src, alt, className, fallbackClassName, onError, ...rest }: Props) {
  const [failed, setFailed] = useState(false);

  // src가 바뀌면 실패 상태를 리셋 — 저장 후 새 이미지가 보이지 않는 버그 방지
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center ${fallbackClassName ?? className ?? ''}`}
        style={{ backgroundColor: 'var(--bg-muted)' }}
      >
        <ImageOff size={20} style={{ color: 'var(--text-muted)' }} className="opacity-50" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={e => {
        setFailed(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
}
