import { ServiceType } from '../../types';

export const SERVICE_LABELS: Record<ServiceType, string> = {
  cut: '커트',
  color: '컬러',
  bleach: '블리치',
  perm: '펌',
  straightening: '매직/스트레이트',
  treatment: '트리트먼트',
  scalp: '두피케어',
  styling: '스타일링',
  other: '기타',
};

/** Theme-aware CSS classes defined in index.css — work in both light and dark mode */
export const SERVICE_COLORS: Record<ServiceType, string> = {
  cut:           'svc-cut',
  color:         'svc-color',
  bleach:        'svc-bleach',
  perm:          'svc-perm',
  straightening: 'svc-straight',
  treatment:     'svc-treat',
  scalp:         'svc-scalp',
  styling:       'svc-styling',
  other:         'svc-other',
};
