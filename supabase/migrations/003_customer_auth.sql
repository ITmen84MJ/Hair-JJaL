-- ===================================================
-- Migration 003: 고객 Auth 연동 + RLS 보강
-- ===================================================

-- clients 테이블에 auth_user_id 컬럼 추가 (없을 경우에만)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 고객이 본인 auth_user_id 기반으로 본인 레코드 조회 가능
-- (기존 shop-based policy 와 OR 로 병용)
DROP POLICY IF EXISTS "clients_select_own" ON clients;
CREATE POLICY "clients_select_own" ON clients
  FOR SELECT USING (auth_user_id = auth.uid());

-- 고객이 본인 상담 이력 조회 가능
DROP POLICY IF EXISTS "consultations_select_own" ON consultations;
CREATE POLICY "consultations_select_own" ON consultations
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );

-- 고객이 본인 예약 조회 가능
DROP POLICY IF EXISTS "bookings_select_own" ON bookings;
CREATE POLICY "bookings_select_own" ON bookings
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );

-- 현재 로그인 고객의 client_id 반환 헬퍼 함수
CREATE OR REPLACE FUNCTION auth_client_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id FROM clients
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;
