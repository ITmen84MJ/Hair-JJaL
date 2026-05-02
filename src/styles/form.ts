/**
 * 앱 전체 공통 폼 스타일
 * P3-25: 파일별 중복 정의(inp, inputStyle, cls) 통합
 */

/** 일반 크기 input/select/textarea Tailwind 클래스 */
export const inputCls =
  'w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300';

/** 작은 크기 (태그 입력 등) */
export const inputClsSm =
  'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300';

/** CSS 변수 기반 인풋 배경·테두리·텍스트 색상 */
export const inputStyle = {
  backgroundColor: 'var(--bg-input)',
  borderColor: 'var(--border-input)',
  color: 'var(--text-primary)',
} as const;
