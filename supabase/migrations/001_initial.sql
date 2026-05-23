-- ===================================================
-- Hair JJaL — Initial Database Schema
-- Supabase PostgreSQL 마이그레이션
-- 모든 CREATE POLICY 앞에 DROP POLICY IF EXISTS 추가 (멱등성 보장)
-- ===================================================

-- ── 테이블 생성 ──────────────────────────────────────

-- 미용실 지점
CREATE TABLE IF NOT EXISTS shops (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  address       TEXT,
  phone         TEXT,
  open_time     TEXT DEFAULT '10:00',
  close_time    TEXT DEFAULT '19:00',
  slot_interval INT  DEFAULT 30,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 디자이너 / 원장 (Supabase Auth users 와 1:1 연결)
CREATE TABLE IF NOT EXISTS designers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       UUID REFERENCES shops(id) ON DELETE CASCADE,
  auth_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'staff',    -- 'staff' | 'manager' | 'owner'
  status        TEXT NOT NULL DEFAULT 'active',   -- 'active' | 'inactive'
  joined_at     DATE,
  left_at       DATE,
  left_reason   TEXT,
  bio           TEXT,
  specialties   TEXT[],
  work_days     INT[],
  day_off       DATE[],
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 고객
CREATE TABLE IF NOT EXISTS clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       UUID REFERENCES shops(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT,
  birth_date    DATE,
  gender        TEXT DEFAULT 'other',
  profile_image TEXT,
  notes         TEXT,
  tags          TEXT[],
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 시술 상담
CREATE TABLE IF NOT EXISTS consultations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id               UUID REFERENCES shops(id)   ON DELETE CASCADE,
  client_id             UUID REFERENCES clients(id) ON DELETE CASCADE,
  stylist_name          TEXT NOT NULL,
  date                  DATE NOT NULL,
  services              JSONB NOT NULL DEFAULT '[]',   -- Service[] (camelCase 그대로 저장)
  hair_condition        TEXT DEFAULT '',
  scalp                 TEXT,
  color_formula         TEXT,
  perm_formula          TEXT,
  before_photo          TEXT,                          -- B3 이후 Storage URL
  after_photo           TEXT,
  notes                 TEXT DEFAULT '',
  next_visit_date       DATE,
  next_visit_note       TEXT,
  is_shared             BOOLEAN DEFAULT false,
  share_token           UUID    DEFAULT gen_random_uuid(),
  modification_request  JSONB,                         -- ModificationRequest 객체
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- 예약
CREATE TABLE IF NOT EXISTS bookings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id            UUID REFERENCES shops(id)   ON DELETE CASCADE,
  client_id          UUID REFERENCES clients(id) ON DELETE CASCADE,
  client_name        TEXT   NOT NULL,
  requested_date     DATE   NOT NULL,
  requested_time     TEXT   NOT NULL,
  service_types      TEXT[] NOT NULL DEFAULT '{}',
  preferred_designer TEXT,
  notes              TEXT,
  status             TEXT   NOT NULL DEFAULT 'pending',  -- 'pending'|'confirmed'|'cancelled'
  confirmed_by       TEXT,
  cancel_reason      TEXT,
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- 웹 푸시 구독 (B5 알림)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id      UUID REFERENCES shops(id)     ON DELETE CASCADE,
  designer_id  UUID REFERENCES designers(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (designer_id)
);

-- ===================================================
-- Row Level Security (RLS)
-- ===================================================

ALTER TABLE shops              ENABLE ROW LEVEL SECURITY;
ALTER TABLE designers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ── 헬퍼 함수 ──────────────────────────────────────

-- 현재 로그인 사용자의 shop_id 조회
CREATE OR REPLACE FUNCTION auth_shop_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER AS $$
  SELECT shop_id FROM designers
  WHERE auth_user_id = auth.uid() AND status = 'active'
  LIMIT 1;
$$;

-- 현재 로그인 사용자의 role 조회
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role FROM designers
  WHERE auth_user_id = auth.uid() AND status = 'active'
  LIMIT 1;
$$;

-- 현재 로그인 사용자의 name 조회
CREATE OR REPLACE FUNCTION auth_designer_name()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT name FROM designers
  WHERE auth_user_id = auth.uid() AND status = 'active'
  LIMIT 1;
$$;

-- ── shops 정책 ──────────────────────────────────────

DROP POLICY IF EXISTS "shops_select" ON shops;
CREATE POLICY "shops_select" ON shops
  FOR SELECT USING (id = auth_shop_id());

DROP POLICY IF EXISTS "shops_update" ON shops;
CREATE POLICY "shops_update" ON shops
  FOR UPDATE USING (
    id = auth_shop_id()
    AND auth_user_role() IN ('owner', 'manager')
  );

-- 최초 가입 시 앱 서버(서비스 키)가 생성 — 브라우저 삽입은 허용 안 함
DROP POLICY IF EXISTS "shops_insert" ON shops;
CREATE POLICY "shops_insert" ON shops
  FOR INSERT WITH CHECK (true);

-- ── designers 정책 ──────────────────────────────────

DROP POLICY IF EXISTS "designers_select" ON designers;
CREATE POLICY "designers_select" ON designers
  FOR SELECT USING (shop_id = auth_shop_id());

DROP POLICY IF EXISTS "designers_update" ON designers;
CREATE POLICY "designers_update" ON designers
  FOR UPDATE USING (
    shop_id = auth_shop_id()
    AND (
      auth_user_id = auth.uid()          -- 본인 정보
      OR auth_user_role() IN ('owner', 'manager')  -- 원장/매니저
    )
  );

DROP POLICY IF EXISTS "designers_insert" ON designers;
CREATE POLICY "designers_insert" ON designers
  FOR INSERT WITH CHECK (
    shop_id = auth_shop_id()
    AND auth_user_role() IN ('owner', 'manager')
  );

-- ── clients 정책 ───────────────────────────────────

DROP POLICY IF EXISTS "clients_select" ON clients;
CREATE POLICY "clients_select" ON clients
  FOR SELECT USING (shop_id = auth_shop_id());

DROP POLICY IF EXISTS "clients_insert" ON clients;
CREATE POLICY "clients_insert" ON clients
  FOR INSERT WITH CHECK (shop_id = auth_shop_id());

DROP POLICY IF EXISTS "clients_update" ON clients;
CREATE POLICY "clients_update" ON clients
  FOR UPDATE USING (shop_id = auth_shop_id());

DROP POLICY IF EXISTS "clients_delete" ON clients;
CREATE POLICY "clients_delete" ON clients
  FOR DELETE USING (
    shop_id = auth_shop_id()
    AND auth_user_role() IN ('owner', 'manager')
  );

-- ── consultations 정책 ─────────────────────────────

-- 공유 링크: 인증 없이 읽기 가능
DROP POLICY IF EXISTS "consultations_public_share" ON consultations;
CREATE POLICY "consultations_public_share" ON consultations
  FOR SELECT USING (is_shared = true);

-- 같은 지점 읽기
DROP POLICY IF EXISTS "consultations_select" ON consultations;
CREATE POLICY "consultations_select" ON consultations
  FOR SELECT USING (shop_id = auth_shop_id());

DROP POLICY IF EXISTS "consultations_insert" ON consultations;
CREATE POLICY "consultations_insert" ON consultations
  FOR INSERT WITH CHECK (shop_id = auth_shop_id());

DROP POLICY IF EXISTS "consultations_update" ON consultations;
CREATE POLICY "consultations_update" ON consultations
  FOR UPDATE USING (
    shop_id = auth_shop_id()
    AND (
      auth_user_role() IN ('owner', 'manager')
      OR stylist_name = auth_designer_name()
    )
  );

DROP POLICY IF EXISTS "consultations_delete" ON consultations;
CREATE POLICY "consultations_delete" ON consultations
  FOR DELETE USING (
    shop_id = auth_shop_id()
    AND (
      auth_user_role() IN ('owner', 'manager')
      OR stylist_name = auth_designer_name()
    )
  );

-- ── bookings 정책 ──────────────────────────────────

DROP POLICY IF EXISTS "bookings_select" ON bookings;
CREATE POLICY "bookings_select" ON bookings
  FOR SELECT USING (shop_id = auth_shop_id());

-- 고객이 익명으로 예약 신청 가능 (앱에서 shopId 관리)
DROP POLICY IF EXISTS "bookings_insert" ON bookings;
CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "bookings_update" ON bookings;
CREATE POLICY "bookings_update" ON bookings
  FOR UPDATE USING (shop_id = auth_shop_id());

-- ── push_subscriptions 정책 ───────────────────────

DROP POLICY IF EXISTS "push_select" ON push_subscriptions;
CREATE POLICY "push_select" ON push_subscriptions
  FOR SELECT USING (shop_id = auth_shop_id());

DROP POLICY IF EXISTS "push_upsert" ON push_subscriptions;
CREATE POLICY "push_upsert" ON push_subscriptions
  FOR INSERT WITH CHECK (shop_id = auth_shop_id());

DROP POLICY IF EXISTS "push_update" ON push_subscriptions;
CREATE POLICY "push_update" ON push_subscriptions
  FOR UPDATE USING (
    designer_id IN (
      SELECT id FROM designers WHERE auth_user_id = auth.uid()
    )
  );

-- ===================================================
-- Storage 버킷: 시술 사진 (B3)
-- ===================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('consultation-photos', 'consultation-photos', true, 5242880)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "photos_read" ON storage.objects;
CREATE POLICY "photos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'consultation-photos');

DROP POLICY IF EXISTS "photos_upload" ON storage.objects;
CREATE POLICY "photos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'consultation-photos'
    AND (storage.foldername(name))[1] = auth_shop_id()::text
  );

DROP POLICY IF EXISTS "photos_delete" ON storage.objects;
CREATE POLICY "photos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'consultation-photos'
    AND (storage.foldername(name))[1] = auth_shop_id()::text
  );
