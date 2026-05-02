/**
 * Canvas를 이용한 이미지 리사이즈·압축
 * base64 데이터 크기를 줄여 localStorage 용량을 절약한다.
 */
export async function compressImage(
  dataUrl: string,
  maxWidth = 1280,
  quality = 0.8,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl); // 실패 시 원본 그대로
    img.src = dataUrl;
  });
}
