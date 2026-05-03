const STORAGE_KEY = 'hairlog_data';

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

/**
 * 전체 앱 데이터를 JSON 파일로 다운로드합니다.
 * 이 파일에는 고객·예약·시술 이력이 모두 포함됩니다.
 * 안전한 장소에 보관하세요.
 */
export function exportData(): void {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const blob = new Blob([raw], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hairjjal_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * JSON 백업 파일을 가져옵니다.
 * 성공 시 페이지를 새로고침해 복원된 데이터를 로드합니다.
 * @param onError 오류 메시지 콜백
 */
export function importData(onError: (msg: string) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const data = JSON.parse(text);
        // 기본 구조 검증
        if (typeof data.version !== 'number' || !Array.isArray(data.clients) || !Array.isArray(data.consultations)) {
          onError('유효하지 않은 백업 파일입니다. Hair JJaL 백업 파일(.json)을 선택해 주세요.');
          return;
        }
        localStorage.setItem(STORAGE_KEY, text);
        window.location.reload();
      } catch {
        onError('파일을 읽을 수 없습니다. JSON 형식을 확인해 주세요.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
