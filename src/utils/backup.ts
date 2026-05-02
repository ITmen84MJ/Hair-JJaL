const STORAGE_KEY = 'hairlog_data';

/** 전체 앱 데이터를 JSON 파일로 내려받기 */
export function exportData(): void {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const blob = new Blob([raw], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `hairjjal-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** JSON 파일을 불러와 localStorage에 덮어쓰기. 성공하면 true 반환. */
export function importData(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // 최소 유효성 검사
        if (!data.version || !Array.isArray(data.clients)) {
          resolve(false);
          return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        resolve(true);
      } catch {
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
}

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
