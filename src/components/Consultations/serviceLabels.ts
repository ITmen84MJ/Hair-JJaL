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

export const SERVICE_COLORS: Record<ServiceType, string> = {
  cut: 'bg-blue-100 text-blue-700',
  color: 'bg-rose-100 text-rose-700',
  bleach: 'bg-yellow-100 text-yellow-700',
  perm: 'bg-purple-100 text-purple-700',
  straightening: 'bg-indigo-100 text-indigo-700',
  treatment: 'bg-green-100 text-green-700',
  scalp: 'bg-teal-100 text-teal-700',
  styling: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700',
};
