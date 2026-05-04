import { describe, it, expect, vi, beforeAll } from 'vitest';
import { compressImage } from '../utils/imageCompress';

beforeAll(() => {
  // Canvas mock
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,compressed');
});

/** Image 클래스를 mock하고 onload를 동기로 실행 */
const mockImage = (width: number, height: number) => {
  return class MockImage {
    onload?: () => void;
    onerror?: () => void;
    naturalWidth = width;
    naturalHeight = height;
    width = width;
    height = height;
    private _src = '';
    get src() { return this._src; }
    set src(v: string) {
      this._src = v;
      // 비동기로 onload 호출
      Promise.resolve().then(() => this.onload?.());
    }
  } as unknown as typeof Image;
};

describe('compressImage', () => {
  it('압축된 data URL을 반환한다 (대형 이미지)', async () => {
    global.Image = mockImage(2000, 1500);
    const result = await compressImage('data:image/jpeg;base64,original', 1280, 0.8);
    expect(result).toMatch(/^data:image\//);
  }, 10000);

  it('small 이미지도 data URL을 반환한다', async () => {
    global.Image = mockImage(800, 600);
    const result = await compressImage('data:image/jpeg;base64,small', 1280, 0.8);
    expect(result).toMatch(/^data:image\//);
  }, 10000);
});
