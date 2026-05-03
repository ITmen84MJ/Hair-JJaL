/**
 * backup.ts
 *
 * ⚠ 보안 결정 (MASVS-STORAGE-1 / OWASP A01):
 *   exportData() / importData() 함수는 고객 이름·전화번호·생년월일 등 민감한 개인정보를
 *   암호화 없이 파일로 내보내거나 가져오는 기능이었습니다.
 *   클라이언트 단독 환경(localStorage)에서는 전송 계층 암호화나 접근 제어를 보장할 수 없으므로
 *   해당 기능을 제거하고 백엔드 도입 시 서버 사이드 암호화 내보내기로 재구현할 것을 권고합니다.
 */

/** localStorage 총 사용량 추산 (UTF-16: 2 bytes/char) */
export function getStorageUsage(): { usedMB: string; percent: number } {
  let bytes = 0;
  for (const key of Object.keys(localStorage)) {
    bytes += (localStorage.getItem(key) ?? '').length * 2;
  }
  const limit = 5 * 1024 * 1024; // 5 MB 추정치
  return {
    usedMB:  (bytes / 1024 / 1024).toFixed(1),
    percent: Math.min(100, Math.round((bytes / limit) * 100)),
  };
}
