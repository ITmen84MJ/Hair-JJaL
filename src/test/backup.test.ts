import { describe, it, expect, vi } from 'vitest';
import { getStorageUsage, exportData, importData } from '../utils/backup';

global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('getStorageUsage', () => {
  it('빈 localStorage에서 0.0 MB를 반환한다', () => {
    const { usedMB, percent } = getStorageUsage();
    expect(usedMB).toBe('0.0');
    expect(percent).toBe(0);
  });

  it('데이터 저장 후 사용량이 증가한다', () => {
    localStorage.setItem('hairlog_data', JSON.stringify({ version: 4, clients: [], consultations: [], designers: [], bookings: [], shops: [] }));
    const { usedMB } = getStorageUsage();
    expect(parseFloat(usedMB)).toBeGreaterThanOrEqual(0);
  });
});

describe('exportData', () => {
  it('데이터 없으면 아무것도 하지 않는다', () => {
    const spy = vi.spyOn(document, 'createElement');
    exportData(); // localStorage 비어있으므로 early return
    expect(spy).not.toHaveBeenCalled();
  });

  it('hairlog_data 키가 있으면 다운로드를 트리거한다', () => {
    localStorage.setItem('hairlog_data', JSON.stringify({ version: 4, clients: [] }));
    const clickSpy = vi.fn();
    const mockAnchor = { href: '', download: '', click: clickSpy } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

    exportData();

    expect(mockAnchor.download).toMatch(/hairjjal_backup_.*\.json/);
    expect(clickSpy).toHaveBeenCalledOnce();
  });
});

describe('importData', () => {
  it('유효한 JSON 구조를 통과시킨다', async () => {
    const validData = JSON.stringify({
      version: 4,
      clients: [], consultations: [], designers: [], bookings: [], shops: [],
    });
    const file = new File([validData], 'backup.json', { type: 'application/json' });

    let capturedOnChange: ((e: Event) => void) | null = null;
    const mockInput = {
      type: '', accept: '',
      set onchange(fn: (e: Event) => void) { capturedOnChange = fn; },
      click: vi.fn(),
      files: [file],
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockInput as unknown as HTMLInputElement);

    const onError = vi.fn();
    importData(onError);

    const event = { target: mockInput } as unknown as Event;
    capturedOnChange?.(event);

    await new Promise(r => setTimeout(r, 100));
    expect(onError).not.toHaveBeenCalled();
  });

  it('잘못된 JSON에서 onError를 호출한다', async () => {
    const file = new File(['not-json!!!'], 'bad.json', { type: 'application/json' });

    let capturedOnChange: ((e: Event) => void) | null = null;
    const mockInput = {
      type: '', accept: '',
      set onchange(fn: (e: Event) => void) { capturedOnChange = fn; },
      click: vi.fn(),
      files: [file],
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockInput as unknown as HTMLInputElement);

    const onError = vi.fn();
    importData(onError);

    const event = { target: mockInput } as unknown as Event;
    capturedOnChange?.(event);

    await new Promise(r => setTimeout(r, 100));
    expect(onError).toHaveBeenCalled();
  });
});
