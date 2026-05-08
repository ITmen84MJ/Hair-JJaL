/**
 * dataMigration — localStorage → Supabase 일회성 데이터 이전
 *
 * 사용법:
 *   원장이 처음 Supabase 모드로 전환할 때
 *   원장 설정 화면에서 "클라우드로 데이터 이전" 버튼을 클릭하면 호출된다.
 *
 *   await migrateLocalStorageToSupabase(shopId)
 *
 * 주의:
 *   - 이전 완료 후 localStorage 의 hairlog_data 는 삭제하지 않는다.
 *     (Supabase 에 정상 업로드됐는지 확인 후 원장이 수동으로 삭제 가능)
 *   - 중복 실행 방지: MIGRATION_DONE_KEY 를 localStorage 에 저장한다.
 */

import { supabase } from '../lib/supabase';
import { toSnake, toDateStr } from '../lib/caseConvert';
import type { Client, Consultation, Designer, Booking } from '../types';

export const MIGRATION_DONE_KEY = 'hairjjal_migration_done';
const STORAGE_KEY = 'hairlog_data';

interface LocalData {
  version?: number;
  clients?: Client[];
  consultations?: Consultation[];
  designers?: Designer[];
  bookings?: Booking[];
}

/** 이미 이전이 완료됐는지 확인 */
export function isMigrationDone(): boolean {
  return localStorage.getItem(MIGRATION_DONE_KEY) === 'true';
}

/** localStorage 에 이전할 데이터가 있는지 확인 */
export function hasMigratableData(): boolean {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const data: LocalData = JSON.parse(raw);
    return (
      (data.clients?.length ?? 0) > 0 ||
      (data.consultations?.length ?? 0) > 0
    );
  } catch { return false; }
}

export interface MigrationResult {
  success: boolean;
  counts: {
    clients: number;
    consultations: number;
    designers: number;
    bookings: number;
  };
  error?: string;
}

/**
 * localStorage 전체 데이터를 Supabase 로 이전한다.
 * @param shopId 현재 로그인한 원장의 지점 ID
 */
export async function migrateLocalStorageToSupabase(
  shopId: string,
): Promise<MigrationResult> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { success: true, counts: { clients: 0, consultations: 0, designers: 0, bookings: 0 } };

  let data: LocalData;
  try {
    data = JSON.parse(raw);
  } catch {
    return { success: false, counts: { clients: 0, consultations: 0, designers: 0, bookings: 0 }, error: '로컬 데이터 파싱 실패' };
  }

  const counts = { clients: 0, consultations: 0, designers: 0, bookings: 0 };

  try {
    // ── 1. 디자이너 ─────────────────────────────────────────────────────────
    if (data.designers?.length) {
      const rows = data.designers
        .filter(d => d.shopId === shopId || !d.shopId)
        .map(d => {
          const { id: _id, ...rest } = d;
          return toSnake({
            ...rest,
            shopId,
            joinedAt:  toDateStr(d.joinedAt),
            leftAt:    toDateStr(d.leftAt),
          }) as Record<string, unknown>;
        });

      if (rows.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('designers') as any).upsert(rows, { onConflict: 'email' });
        if (error) throw new Error(`디자이너 이전 실패: ${error.message}`);
        counts.designers = rows.length;
      }
    }

    // ── 2. 고객 ────────────────────────────────────────────────────────────
    if (data.clients?.length) {
      // 기존 ID를 유지해야 상담 기록의 clientId 참조가 깨지지 않는다.
      const rows = data.clients
        .filter(c => !c.shopId || c.shopId === shopId)
        .map(c => toSnake({ ...c, shopId }) as Record<string, unknown>);

      if (rows.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('clients') as any).upsert(rows, { onConflict: 'id' });
        if (error) throw new Error(`고객 이전 실패: ${error.message}`);
        counts.clients = rows.length;
      }
    }

    // ── 3. 상담 ────────────────────────────────────────────────────────────
    if (data.consultations?.length) {
      const rows = data.consultations
        .filter(c => !c.shopId || c.shopId === shopId)
        .map(c => {
          const snake = toSnake({ ...c, shopId }) as Record<string, unknown>;
          snake['services'] = c.services;                          // JSONB: camelCase 그대로
          snake['modification_request'] = c.modificationRequest ?? null;
          return snake;
        });

      if (rows.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('consultations') as any).upsert(rows, { onConflict: 'id' });
        if (error) throw new Error(`상담 이전 실패: ${error.message}`);
        counts.consultations = rows.length;
      }
    }

    // ── 4. 예약 ────────────────────────────────────────────────────────────
    if (data.bookings?.length) {
      const rows = data.bookings
        .filter(b => b.shopId === shopId || !b.shopId)
        .map(b => toSnake({ ...b, shopId }) as Record<string, unknown>);

      if (rows.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('bookings') as any).upsert(rows, { onConflict: 'id' });
        if (error) throw new Error(`예약 이전 실패: ${error.message}`);
        counts.bookings = rows.length;
      }
    }

    // 이전 완료 플래그 저장
    localStorage.setItem(MIGRATION_DONE_KEY, 'true');

    return { success: true, counts };

  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return { success: false, counts, error: message };
  }
}
