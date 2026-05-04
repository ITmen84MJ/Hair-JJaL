import { describe, it, expect, vi } from 'vitest';
import { exportClientHistory, exportAllClients } from '../utils/csv';
import type { Client, Consultation } from '../types';

global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

const mockClient: Client = {
  id: 'c1', name: '김테스트', phone: '010-0000-0000',
  gender: 'female', createdAt: '2024-01-01',
};

const mockConsultation: Consultation = {
  id: 'con1', shopId: 's1', clientId: 'c1',
  date: '2024-03-15', stylistName: '박스타일',
  services: [{ type: 'cut', description: '레이어드 컷', price: 30000 }],
  hairCondition: '보통', notes: '테스트 메모',
  shareToken: 'tok1', isShared: false, createdAt: '2024-03-15',
};

const mockClick = vi.fn();
const mockAnchor = () => {
  const a = { href: '', download: '', click: mockClick, style: { display: '' } } as unknown as HTMLAnchorElement;
  vi.spyOn(document, 'createElement').mockReturnValueOnce(a);
  vi.spyOn(document.body, 'appendChild').mockReturnValueOnce(a);
  vi.spyOn(document.body, 'removeChild').mockReturnValueOnce(a);
  return a;
};

describe('exportClientHistory', () => {
  it('CSV 파일명에 고객명이 포함된다', () => {
    const a = mockAnchor();
    exportClientHistory(mockClient, [mockConsultation]);
    expect(a.download).toContain('김테스트');
    expect(a.download).toMatch(/\.csv$/);
    expect(mockClick).toHaveBeenCalledOnce();
  });
});

describe('exportAllClients', () => {
  it('CSV 파일을 다운로드한다', () => {
    const a = mockAnchor();
    exportAllClients([mockClient], [mockConsultation]);
    expect(a.download).toMatch(/\.csv$/);
    expect(mockClick).toHaveBeenCalledOnce();
  });
});
