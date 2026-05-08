/**
 * Supabase DB 타입 정의 (수동 작성)
 * 프로덕션에서는 `npx supabase gen types typescript` 로 자동 생성 권장
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ── Row 타입 (DB에서 읽을 때) ───────────────────────────────────────────

export interface ShopRow {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  open_time: string | null;
  close_time: string | null;
  slot_interval: number | null;
  created_at: string;
}

export interface DesignerRow {
  id: string;
  shop_id: string | null;
  auth_user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  joined_at: string | null;
  left_at: string | null;
  left_reason: string | null;
  bio: string | null;
  specialties: string[] | null;
  work_days: number[] | null;
  day_off: string[] | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ClientRow {
  id: string;
  shop_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  birth_date: string | null;
  gender: string | null;
  profile_image: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface ConsultationRow {
  id: string;
  shop_id: string | null;
  client_id: string | null;
  stylist_name: string;
  date: string;
  services: Json;
  hair_condition: string | null;
  scalp: string | null;
  color_formula: string | null;
  perm_formula: string | null;
  before_photo: string | null;
  after_photo: string | null;
  notes: string | null;
  next_visit_date: string | null;
  next_visit_note: string | null;
  is_shared: boolean;
  share_token: string;
  modification_request: Json | null;
  created_at: string;
}

export interface BookingRow {
  id: string;
  shop_id: string | null;
  client_id: string | null;
  client_name: string;
  requested_date: string;
  requested_time: string;
  service_types: string[];
  preferred_designer: string | null;
  notes: string | null;
  status: string;
  confirmed_by: string | null;
  cancel_reason: string | null;
  created_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  shop_id: string | null;
  designer_id: string | null;
  subscription: Json;
  created_at: string;
}

// ── Insert 타입 (DB에 쓸 때 — id/created_at 제외) ─────────────────────

export type ShopInsert = Omit<ShopRow, 'id' | 'created_at'>;
export type DesignerInsert = Omit<DesignerRow, 'id' | 'created_at'>;
export type ClientInsert = Omit<ClientRow, 'id' | 'created_at'>;
export type ConsultationInsert = Omit<ConsultationRow, 'id' | 'created_at'>;
export type BookingInsert = Omit<BookingRow, 'id' | 'created_at'>;

// ── Database 타입 (Supabase 클라이언트 제네릭용) ──────────────────────

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: ShopRow;
        Insert: ShopInsert;
        Update: Partial<ShopInsert>;
      };
      designers: {
        Row: DesignerRow;
        Insert: DesignerInsert;
        Update: Partial<DesignerInsert>;
      };
      clients: {
        Row: ClientRow;
        Insert: ClientInsert;
        Update: Partial<ClientInsert>;
      };
      consultations: {
        Row: ConsultationRow;
        Insert: ConsultationInsert;
        Update: Partial<ConsultationInsert>;
      };
      bookings: {
        Row: BookingRow;
        Insert: Omit<BookingRow, 'id' | 'created_at'>;
        Update: Partial<Omit<BookingRow, 'id' | 'created_at'>>;
      };
      push_subscriptions: {
        Row: PushSubscriptionRow;
        Insert: Omit<PushSubscriptionRow, 'id' | 'created_at'>;
        Update: Partial<Omit<PushSubscriptionRow, 'id' | 'created_at'>>;
      };
    };
    Functions: {
      auth_shop_id: { Returns: string };
      auth_user_role: { Returns: string };
      auth_designer_name: { Returns: string };
    };
  };
}
