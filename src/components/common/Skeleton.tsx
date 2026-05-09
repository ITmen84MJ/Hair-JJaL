/**
 * Skeleton — 로딩 자리표시자 (1-4)
 *
 * 사용 예)
 *   <Skeleton className="h-5 w-32 rounded-lg" />
 *   <SkeletonCard />
 *   <SkeletonList rows={4} />
 */

interface SkeletonProps {
  className?: string;
}

/** 기본 골격 블록: className으로 크기/모양 지정 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ backgroundColor: 'var(--bg-skeleton, #e5e7eb)' }}
      aria-hidden="true"
    />
  );
}

/** 카드형 스켈레톤 — 헤더(이름) + 2줄 서브텍스트 */
export function SkeletonCard() {
  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-3 w-20 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-3 w-full rounded-md" />
      <Skeleton className="h-3 w-4/5 rounded-md" />
    </div>
  );
}

/** 리스트형 스켈레톤 — rows 개수만큼 카드 반복 */
export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-label="로딩중" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** 통계 카드형 스켈레톤 */
export function SkeletonStatCard() {
  return (
    <div
      className="rounded-2xl border p-4 space-y-2"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      aria-hidden="true"
    >
      <Skeleton className="h-3 w-20 rounded-md" />
      <Skeleton className="h-7 w-28 rounded-md" />
      <Skeleton className="h-3 w-16 rounded-md" />
    </div>
  );
}
