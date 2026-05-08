/**
 * camelCase ↔ snake_case 변환 유틸리티
 *
 * DB는 snake_case, 앱 코드는 camelCase 를 사용한다.
 * Supabase 호출 경계(삽입·조회)에서만 변환이 일어난다.
 *
 * 주의: JSONB 컬럼(services, modification_request)은 이미 앱 타입과 같은
 *       형태로 저장되므로 중첩 변환을 건너뛴다.
 */

type Primitive = string | number | boolean | null | undefined;
type AnyObject = Record<string, unknown>;

const SKIP_DEEP = new Set(['services', 'modificationRequest', 'modification_request']);

// ── snake → camel ──────────────────────────────────────────────────────

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * DB Row(snake_case) → 앱 객체(camelCase)
 * 특수 케이스: avatar_url → avatar (Designer.avatar 필드에 맞춤)
 */
export function toCamel<T = AnyObject>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) return obj.map(item => toCamel(item)) as unknown as T;
  if (typeof obj !== 'object') return obj as T;

  const record = obj as AnyObject;
  const result: AnyObject = {};

  for (const [key, value] of Object.entries(record)) {
    // avatar_url → avatar (DB 컬럼명과 앱 필드명 불일치 처리)
    const camelKey = key === 'avatar_url' ? 'avatar' : snakeToCamel(key);

    if (SKIP_DEEP.has(key) || SKIP_DEEP.has(camelKey)) {
      result[camelKey] = value;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = toCamel(value);
    } else {
      result[camelKey] = value;
    }
  }

  return result as T;
}

// ── camel → snake ──────────────────────────────────────────────────────

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
}

/**
 * 앱 객체(camelCase) → DB Insert 객체(snake_case)
 * 특수 케이스: avatar → avatar_url
 * undefined 값은 제거 (Supabase INSERT 시 불필요한 null 방지)
 */
export function toSnake<T = AnyObject>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) return obj.map(item => toSnake(item)) as unknown as T;
  if (typeof obj !== 'object') return obj as unknown as T;

  const record = obj as AnyObject;
  const result: AnyObject = {};

  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) continue; // undefined 필드 제거

    // avatar → avatar_url
    const snakeKey = key === 'avatar' ? 'avatar_url' : camelToSnake(key);

    if (SKIP_DEEP.has(key) || SKIP_DEEP.has(snakeKey)) {
      result[snakeKey] = value;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[snakeKey] = toSnake(value);
    } else {
      result[snakeKey] = value;
    }
  }

  return result as T;
}

// ── 타입-세이프 헬퍼 ──────────────────────────────────────────────────

/** 앱 타입에서 DB insert 에 필요 없는 필드 제거 후 snake_case 변환 */
export function toInsert<T extends { id?: string; createdAt?: string; shopId?: string }>(
  obj: T,
  shopId?: string,
): AnyObject {
  const { id: _id, createdAt: _ca, ...rest } = obj;
  return toSnake({ ...rest, ...(shopId ? { shopId } : {}) }) as AnyObject;
}

/** Date 필드(ISO string → DATE string) 정규화: YYYY-MM-DD 만 남김 */
export function toDateStr(iso: string | undefined | null): string | null {
  if (!iso) return null;
  return iso.slice(0, 10); // YYYY-MM-DD
}

export type { Primitive };
