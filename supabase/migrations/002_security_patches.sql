-- ===================================================
-- Hair JJaL — Security & Data Integrity Patches
-- ===================================================
-- 실행 전 반드시 Supabase SQL Editor 에서 한 번에 실행하세요.
-- 각 Step 은 순서대로 의존 관계가 있습니다.
-- ===================================================


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 0 ▸ 중복 디자이너 레코드 정리
--   동일 (shop_id, email) 에 active + inactive 레코드가
--   공존하는 경우 데이터 무결성 오류 발생.
--   가장 오래된(원본) 레코드를 살리고 신규 중복을 제거.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO $$
DECLARE
  r             RECORD;
  v_original_id UUID;
  v_new_auth    UUID;
BEGIN
  FOR r IN
    SELECT shop_id, lower(email) AS email
    FROM   designers
    GROUP  BY shop_id, lower(email)
    HAVING COUNT(*) > 1
  LOOP
    -- 원본: 가장 먼저 생성된 레코드
    SELECT id
    INTO   v_original_id
    FROM   designers
    WHERE  shop_id    = r.shop_id
      AND  lower(email) = r.email
    ORDER  BY created_at ASC
    LIMIT  1;

    -- 신규 중복 레코드 중 auth_user_id 가 있는 것 수집
    SELECT auth_user_id
    INTO   v_new_auth
    FROM   designers
    WHERE  shop_id      = r.shop_id
      AND  lower(email) = r.email
      AND  id           <> v_original_id
      AND  auth_user_id IS NOT NULL
    ORDER  BY created_at DESC
    LIMIT  1;

    -- 원본 레코드: 재활성화 + auth_user_id 이전
    UPDATE designers
    SET    status       = 'active',
           left_at      = NULL,
           left_reason  = NULL,
           auth_user_id = COALESCE(v_new_auth, auth_user_id)
    WHERE  id = v_original_id;

    -- 중복 레코드 삭제 (원본 제외)
    DELETE FROM designers
    WHERE  shop_id      = r.shop_id
      AND  lower(email) = r.email
      AND  id           <> v_original_id;

    RAISE NOTICE '✅ 정리 완료: email=%, 보존 id=%', r.email, v_original_id;
  END LOOP;
END;
$$;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 1 ▸ 향후 중복 방지 — (shop_id, email) 유니크 인덱스
--   같은 지점 내 이메일 중복 INSERT 를 DB 레벨에서 차단.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE UNIQUE INDEX IF NOT EXISTS designers_shop_email_unique
  ON designers (shop_id, lower(email));


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 2 ▸ RLS-03: auth_shop_id() ORDER BY 추가
--   LIMIT 1 + ORDER BY 없으면 레코드가 둘 이상일 때
--   비결정적(non-deterministic) 결과 반환.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION auth_shop_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER AS $$
  SELECT shop_id
  FROM   designers
  WHERE  auth_user_id = auth.uid()
    AND  status       = 'active'
  ORDER  BY created_at DESC
  LIMIT  1;
$$;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 3 ▸ RLS-02: bookings_insert — shop_id 유효성 검증
--   기존: WITH CHECK (true) → 임의 shop_id 로 예약 가능
--   개선: shops 테이블에 실제 존재하는 shop_id 만 허용
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP POLICY IF EXISTS "bookings_insert" ON bookings;
CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM shops WHERE id = shop_id)
  );


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 4 ▸ RLS-06: push_upsert — designer_id 소유자 검증
--   기존: shop_id 만 확인 → 타 디자이너 구독 덮어쓰기 가능
--   개선: 본인(auth.uid()) 디자이너 레코드에만 삽입 허용
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP POLICY IF EXISTS "push_upsert" ON push_subscriptions;
CREATE POLICY "push_upsert" ON push_subscriptions
  FOR INSERT WITH CHECK (
    shop_id = auth_shop_id()
    AND designer_id IN (
      SELECT id FROM designers WHERE auth_user_id = auth.uid()
    )
  );


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 5 ▸ RLS-07: search_unassigned_users 마이그레이션 등록
--   StaffTab 직원 추가 검색에서 사용하는 RPC 함수.
--   기존 계정(퇴직 포함 모든 상태)을 제외하여 중복 방지.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION search_unassigned_users(search_query TEXT)
RETURNS TABLE(auth_user_id UUID, email TEXT, display_name TEXT)
SECURITY DEFINER LANGUAGE sql AS $$
  SELECT
    u.id                                                   AS auth_user_id,
    u.email                                                AS email,
    COALESCE(u.raw_user_meta_data->>'name', u.email)       AS display_name
  FROM auth.users u
  WHERE
    (
      u.email                        ILIKE '%' || search_query || '%'
      OR u.raw_user_meta_data->>'name' ILIKE '%' || search_query || '%'
    )
    AND NOT EXISTS (
      -- 퇴직(inactive) 포함 모든 기존 연결 제외
      SELECT 1 FROM designers d
      WHERE d.auth_user_id = u.id
    )
  ORDER BY u.email
  LIMIT 20;
$$;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 6 ▸ RLS-04: consultations 에 designer_id 컬럼 추가
--   stylist_name(TEXT) 의존 제거 준비.
--   기존 데이터 → 같은 지점 + 같은 이름의 active 디자이너로 매핑.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS designer_id UUID
    REFERENCES designers(id) ON DELETE SET NULL;

-- 기존 데이터 최선-노력(best-effort) 매핑
UPDATE consultations c
SET    designer_id = d.id
FROM   designers d
WHERE  c.stylist_name  = d.name
  AND  c.shop_id       = d.shop_id
  AND  d.status        = 'active'
  AND  c.designer_id IS NULL;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 7 ▸ AUTH-05: 고객 셀프 회원가입 스키마
--   clients 테이블에 auth_user_id 컬럼 추가.
--   register_customer() SECURITY DEFINER 함수로
--   인증된 고객이 자신의 client 레코드를 생성/연결.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS auth_user_id UUID
    REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS clients_auth_user_id_idx
  ON clients (auth_user_id);

-- 고객 자신의 client 레코드 읽기 허용
DROP POLICY IF EXISTS "clients_self_select"  ON clients;
CREATE POLICY "clients_self_select" ON clients
  FOR SELECT USING (auth_user_id = auth.uid());

-- 고객 자신의 예약 읽기 허용
DROP POLICY IF EXISTS "bookings_customer_select" ON bookings;
CREATE POLICY "bookings_customer_select" ON bookings
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );

-- 고객 자신의 상담 이력 읽기 허용
DROP POLICY IF EXISTS "consultations_customer_select" ON consultations;
CREATE POLICY "consultations_customer_select" ON consultations
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );

-- 지점 목록 공개 조회 (고객 회원가입 시 지점 선택용)
DROP POLICY IF EXISTS "shops_public_select" ON shops;
CREATE POLICY "shops_public_select" ON shops
  FOR SELECT USING (true);

-- SECURITY DEFINER 함수: 고객 레코드 생성 및 Auth 연결
CREATE OR REPLACE FUNCTION register_customer(
  p_shop_id UUID,
  p_name    TEXT,
  p_phone   TEXT,
  p_email   TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_id UUID;
BEGIN
  -- 유효한 지점인지 확인
  IF NOT EXISTS (SELECT 1 FROM shops WHERE id = p_shop_id) THEN
    RAISE EXCEPTION '지점을 찾을 수 없습니다 (shop_id=%)', p_shop_id;
  END IF;

  -- 같은 지점 + 같은 전화번호의 기존 client 레코드 검색
  SELECT id INTO v_client_id
  FROM   clients
  WHERE  shop_id = p_shop_id
    AND  phone   = p_phone
  LIMIT  1;

  IF v_client_id IS NOT NULL THEN
    -- 기존 레코드에 Auth 계정 연결
    UPDATE clients
    SET    auth_user_id = auth.uid()
    WHERE  id           = v_client_id;
  ELSE
    -- 신규 client 레코드 생성
    INSERT INTO clients (shop_id, name, phone, email, auth_user_id)
    VALUES (p_shop_id, p_name, p_phone, p_email, auth.uid())
    RETURNING id INTO v_client_id;
  END IF;

  -- Auth user_metadata 에 clientId + role 기록
  UPDATE auth.users
  SET    raw_user_meta_data = raw_user_meta_data ||
           jsonb_build_object(
             'clientId', v_client_id::text,
             'shopId',   p_shop_id::text,
             'role',     'customer',
             'name',     p_name
           )
  WHERE  id = auth.uid();

  RETURN v_client_id;
END;
$$;
