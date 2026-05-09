/**
 * imageCompress — Canvas 기반 이미지 압축 + Supabase Storage 업로드 (B3)
 *
 * localStorage 모드: base64 문자열 반환
 * Supabase 모드:     압축 후 Storage 업로드 → CDN URL 반환
 *
 * onChange 인터페이스(string 반환)가 동일하므로 ConsultationForm 코드 변경 불필요.
 */

import { supabase, USE_SUPABASE } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const BUCKET = 'consultation-photos';

// ── Base64 ↔ Blob 변환 ────────────────────────────────────────────────────

export function dataURLtoBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ── Canvas 압축 ────────────────────────────────────────────────────────────

/**
 * base64 dataURL 을 Canvas 로 리사이즈 + JPEG 압축.
 * 결과도 base64 dataURL 반환.
 */
export async function compressImage(
  dataUrl: string,
  maxWidth = 1280,
  quality  = 0.8,
): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const ratio  = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ── Supabase Storage 업로드 ───────────────────────────────────────────────

/**
 * 이미지 업로드 통합 함수.
 *
 * - Supabase 모드: 압축 → Storage 업로드 → CDN URL 반환
 * - localStorage 모드: 압축 → base64 반환 (Storage 미사용)
 *
 * @param dataUrl  base64 dataURL (파일 입력 또는 카메라 캡처)
 * @param shopId   현재 지점 ID (Storage 폴더 구조: shopId/clientId/uuid.jpg)
 * @param clientId 고객 ID
 * @returns        저장된 이미지 문자열 (URL 또는 base64)
 */
export async function uploadOrCompressPhoto(
  dataUrl:  string,
  shopId:   string,
  clientId: string,
): Promise<string> {
  // 먼저 압축
  const compressed = await compressImage(dataUrl);

  if (!USE_SUPABASE) {
    // localStorage 모드: base64 그대로 반환
    return compressed;
  }

  // Supabase 모드: Storage 업로드
  try {
    const blob = dataURLtoBlob(compressed);
    const path = `${shopId}/${clientId}/${uuidv4()}.jpg`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: 'image/jpeg', upsert: false });

    if (error || !data) {
      console.warn('[uploadPhoto] Storage 업로드 실패, base64 사용:', error?.message);
      return compressed; // 폴백: base64 사용
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(data.path);

    // Storage URL 접근 가능 여부 확인 — 버킷이 private이거나 RLS 문제 시 base64로 폴백
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(publicUrl, { method: 'HEAD', signal: ctrl.signal });
      clearTimeout(tid);
      if (res.ok) return publicUrl;
    } catch { /* 타임아웃 또는 CORS — base64 사용 */ }
    console.warn('[uploadPhoto] Storage URL 접근 불가, base64 사용');
    return compressed;
  } catch (e) {
    console.warn('[uploadPhoto] 예외 발생, base64 사용:', e);
    return compressed;
  }
}

/**
 * Storage URL 인지 base64 인지 판별.
 * 사진 삭제 시 Storage URL 이면 Storage 에서도 제거한다.
 */
export async function deletePhotoIfStorageUrl(url: string | undefined): Promise<void> {
  if (!url || !USE_SUPABASE) return;
  if (!url.startsWith('http')) return; // base64 — 무시

  try {
    // URL 에서 Storage path 추출: .../storage/v1/object/public/consultation-photos/PATH
    const marker = `/object/public/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = url.slice(idx + marker.length);
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {}
}
