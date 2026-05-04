import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxImage {
  src: string;
  alt?: string;
  caption?: string;
}

interface Props {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onChangeIndex?: (index: number) => void;
}

export function Lightbox({ images, index, onClose, onChangeIndex }: Props) {
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  const prev = useCallback(() => {
    if (hasPrev) onChangeIndex?.(index - 1);
  }, [hasPrev, index, onChangeIndex]);

  const next = useCallback(() => {
    if (hasNext) onChangeIndex?.(index + 1);
  }, [hasNext, index, onChangeIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  // Body scroll lock
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  const current = images[index];
  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사진 확대 보기"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="닫기"
        className="absolute top-4 right-4 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors z-10"
      >
        <X size={22} />
      </button>

      {/* Prev button */}
      {hasPrev && (
        <button
          onClick={e => { e.stopPropagation(); prev(); }}
          aria-label="이전 사진"
          className="absolute left-3 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Image */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-3"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={current.src}
          alt={current.alt ?? ''}
          className="max-w-full max-h-[80vh] object-contain rounded-xl select-none"
          draggable={false}
        />
        {current.caption && (
          <p className="text-white/60 text-sm text-center">{current.caption}</p>
        )}
        {images.length > 1 && (
          <div className="flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                aria-label={`사진 ${i + 1}`}
                onClick={e => { e.stopPropagation(); onChangeIndex?.(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Next button */}
      {hasNext && (
        <button
          onClick={e => { e.stopPropagation(); next(); }}
          aria-label="다음 사진"
          className="absolute right-3 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <ChevronRight size={28} />
        </button>
      )}
    </div>
  );
}
