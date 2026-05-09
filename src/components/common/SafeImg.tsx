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
  const [loaded, setLoaded] = useState(false);

  // src가 바뀌면 실패·로드 상태 리셋
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  // HTTP URL(Supabase Storage)은 응답이 느리면 onError가 한참 뒤에 올 수 있음.
  // onLoad가 성공했거나 이미 에러 상태면 타이머 설정 안 함
  useEffect(() => {
    if (!src || failed || loaded) return;
    if (!src.startsWith('http')) return;
    const tid = setTimeout(() => setFailed(true), 8000);
    return () => clearTimeout(tid);
  }, [src, failed, loaded]);

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
      onLoad={() => setLoaded(true)}
      onError={e => {
        setFailed(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
}
