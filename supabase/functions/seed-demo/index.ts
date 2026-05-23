/**
 * seed-demo — 데모 데이터 + 데모 계정을 Supabase 에 한 번에 심는 Edge Function.
 *
 * POST /functions/v1/seed-demo
 * Body: { secret: "YOUR_SEED_SECRET" }   ← 무단 실행 방지
 *
 * 멱등(idempotent): 이미 존재하는 데이터는 upsert 로 덮어씀.
 *
 * 실행 방법:
 *   Supabase Dashboard → Edge Functions → seed-demo → "Invoke"
 *   또는 curl:
 *     curl -X POST \
 *       https://<your-project>.supabase.co/functions/v1/seed-demo \
 *       -H "Authorization: Bearer <anon_key>" \
 *       -H "Content-Type: application/json" \
 *       -d '{"secret":"demo-seed-2024"}'
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── 고정 UUID (mock ID → 실제 UUID 매핑) ─────────────────────────
const S1  = '10000000-0000-0000-0000-000000000001'; // 강남점
const S2  = '10000000-0000-0000-0000-000000000002'; // 홍대점
const D1  = '20000000-0000-0000-0000-000000000001'; // 박스타일
const D2  = '20000000-0000-0000-0000-000000000002'; // 김헤어
const D3  = '20000000-0000-0000-0000-000000000003'; // 이드레스 (강남 퇴직)
const D3B = '20000000-0000-0000-0000-000000000004'; // 이드레스 (홍대 재직)
const D4  = '20000000-0000-0000-0000-000000000005'; // 정스타일
const D5  = '20000000-0000-0000-0000-000000000006'; // 오컬러
const D6  = '20000000-0000-0000-0000-000000000007'; // 홍원장
const D7  = '20000000-0000-0000-0000-000000000008'; // 최원장
const C1  = '30000000-0000-0000-0000-000000000001'; // 김지수
const C2  = '30000000-0000-0000-0000-000000000002'; // 이민준
const C3  = '30000000-0000-0000-0000-000000000003'; // 박소연
const C4  = '30000000-0000-0000-0000-000000000004'; // 최현우
const C5  = '30000000-0000-0000-0000-000000000005'; // 이소연
const C6  = '30000000-0000-0000-0000-000000000006'; // 강민서

const DEMO_PASS = Deno.env.get('DEMO_PASSWORD') ?? 'demo1234';
const SEED_SECRET = Deno.env.get('SEED_SECRET') ?? 'demo-seed-2024';

// ── 데모 Auth 계정 정의 ───────────────────────────────────────────
const DEMO_USERS = [
  { email: 'park@hairjjal.com',   designerId: D1,  role: 'designer', shopId: S1, name: '박스타일', designerName: '박스타일' },
  { email: 'kim@hairjjal.com',    designerId: D2,  role: 'designer', shopId: S1, name: '김헤어',   designerName: '김헤어'   },
  { email: 'lee@hairjjal.com',    designerId: D3B, role: 'designer', shopId: S2, name: '이드레스', designerName: '이드레스' },
  { email: 'owner@hairjjal.com',  designerId: D6,  role: 'owner',    shopId: S1, name: '홍원장',   designerName: '홍원장'   },
  { email: 'jeong@hairjjal.com',  designerId: D4,  role: 'designer', shopId: S2, name: '정스타일', designerName: '정스타일' },
  { email: 'oh@hairjjal.com',     designerId: D5,  role: 'designer', shopId: S2, name: '오컬러',   designerName: '오컬러'   },
  { email: 'owner2@hairjjal.com', designerId: D7,  role: 'owner',    shopId: S2, name: '최원장',   designerName: '최원장'   },
  // 고객 계정
  { email: 'jisoo@example.com',   clientId: C1,    role: 'customer', shopId: S1, name: '김지수' },
  { email: 'soyeon@example.com',  clientId: C5,    role: 'customer', shopId: S2, name: '이소연' },
];

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // 시크릿 검증
  let body: { secret?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  if (body.secret !== SEED_SECRET) {
    return new Response(JSON.stringify({ error: 'Invalid secret' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  // 서비스 롤 클라이언트 (RLS 우회)
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const log: string[] = [];

  // ── 1. 지점 ──────────────────────────────────────────────────
  const { error: shopErr } = await admin.from('shops').upsert([
    { id: S1, name: '헤어 짤 강남점', address: '서울시 강남구 테헤란로 123', phone: '02-1234-5678', open_time: '10:00', close_time: '19:00', slot_interval: 30 },
    { id: S2, name: '헤어 짤 홍대점', address: '서울시 마포구 홍익로 45',   phone: '02-9876-5432', open_time: '10:00', close_time: '19:00', slot_interval: 30 },
  ], { onConflict: 'id' });
  if (shopErr) return err('shops', shopErr);
  log.push('✓ shops');

  // ── 2. 디자이너 ──────────────────────────────────────────────
  const { error: dsnErr } = await admin.from('designers').upsert([
    { id: D1,  shop_id: S1, name: '박스타일', email: 'park@hairjjal.com',   phone: '010-1111-2222', role: 'staff',   status: 'active',   joined_at: '2023-03-01' },
    { id: D2,  shop_id: S1, name: '김헤어',   email: 'kim@hairjjal.com',    phone: '010-3333-4444', role: 'staff',   status: 'active',   joined_at: '2024-01-15' },
    { id: D3,  shop_id: S1, name: '이드레스', email: 'lee@hairjjal.com',    phone: '010-5555-6666', role: 'staff',   status: 'inactive', joined_at: '2022-06-01', left_at: '2025-12-31', left_reason: '이직' },
    { id: D3B, shop_id: S2, name: '이드레스', email: 'lee@hairjjal.com',    phone: '010-5555-6666', role: 'staff',   status: 'active',   joined_at: '2026-01-10', bio: '컬러 전문 스타일리스트 | 강남·홍대 경력 4년', specialties: ['color', 'bleach', 'cut'] },
    { id: D4,  shop_id: S2, name: '정스타일', email: 'jeong@hairjjal.com',  phone: '010-7777-8888', role: 'staff',   status: 'active',   joined_at: '2023-06-01' },
    { id: D5,  shop_id: S2, name: '오컬러',   email: 'oh@hairjjal.com',     phone: '010-9999-0000', role: 'staff',   status: 'active',   joined_at: '2024-03-01' },
    { id: D6,  shop_id: S1, name: '홍원장',   email: 'owner@hairjjal.com',  phone: '010-0001-1111', role: 'owner',   status: 'active',   joined_at: '2023-01-01' },
    { id: D7,  shop_id: S2, name: '최원장',   email: 'owner2@hairjjal.com', phone: '010-0002-2222', role: 'owner',   status: 'active',   joined_at: '2023-06-01' },
  ], { onConflict: 'id' });
  if (dsnErr) return err('designers', dsnErr);
  log.push('✓ designers');

  // ── 3. 고객 ──────────────────────────────────────────────────
  const { error: clientErr } = await admin.from('clients').upsert([
    { id: C1, shop_id: S1, name: '김지수', phone: '010-1234-5678', email: 'jisoo@example.com',   birth_date: '1995-03-15', gender: 'female', notes: '두피 민감, 산성 샴푸 사용 권장', tags: ['단골', 'VIP'] },
    { id: C2, shop_id: S1, name: '이민준', phone: '010-9876-5432', email: 'minjun@example.com',  birth_date: '1990-07-22', gender: 'male',   notes: '모발 굵고 빳빳함, 컷만 선호', tags: ['정기방문'] },
    { id: C3, shop_id: S1, name: '박소연', phone: '010-5555-7777',                               birth_date: '1998-11-08', gender: 'female', notes: '손상모, 트리트먼트 필수', tags: ['손상모', '단골'] },
    { id: C4, shop_id: S1, name: '최현우', phone: '010-3333-4444',                               birth_date: '1988-05-30', gender: 'male',   notes: '새치 있음, 자연스러운 컬러 선호', tags: ['새치커버'] },
    { id: C5, shop_id: S2, name: '이소연', phone: '010-2222-3333', email: 'soyeon@example.com',  birth_date: '1997-05-20', gender: 'female', notes: '밝은 컬러 선호, 탈색 이력 많음', tags: ['단골', 'VIP'] },
    { id: C6, shop_id: S2, name: '강민서', phone: '010-4444-5555',                               birth_date: '2000-09-15', gender: 'female', notes: '첫 방문 고객, 펌 관심', tags: [] },
  ], { onConflict: 'id' });
  if (clientErr) return err('clients', clientErr);
  log.push('✓ clients');

  // ── 4. 상담 이력 ─────────────────────────────────────────────
  const { error: conErr } = await admin.from('consultations').upsert([
    {
      id: '40000000-0000-0000-0000-000000000001',
      shop_id: S1, client_id: C1, stylist_name: '박스타일', date: '2026-04-28',
      services: [{ type: 'color', description: '버진 블리치 + 애쉬 베이지 컬러', price: 180000 }, { type: 'treatment', description: '케라틴 트리트먼트', price: 50000 }],
      before_photo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=500&fit=crop&q=80',
      after_photo:  'https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=400&h=500&fit=crop&q=80',
      hair_condition: '모발 상태 보통, 기존 펌 손상 있음', scalp: '지성 두피, 예민하지 않음',
      color_formula: 'Wella 12/61 + Blondor + 9% (1:2) → 토너: 10/16 + 8/69 (50:50) + 1.9%',
      notes: '고객이 쿨톤 애쉬 베이지 원함. 다음 방문 시 토너 보정 필요.',
      next_visit_date: '2026-06-15', next_visit_note: '토너 보정 및 뿌리 염색',
      is_shared: true, share_token: 'a0000000-0000-0000-0000-000000000001',
    },
    {
      id: '40000000-0000-0000-0000-000000000002',
      shop_id: S1, client_id: C1, stylist_name: '박스타일', date: '2026-01-18',
      services: [{ type: 'cut', description: '레이어드 컷 + 앞머리', price: 40000 }, { type: 'perm', description: '볼륨 매직 (반매직)', price: 130000 }],
      hair_condition: '약간 건조, 끝부분 손상', scalp: '정상',
      perm_formula: 'Milbon Ordeve 2제 사용, 두상 상단 20분 / 끝 15분',
      notes: '반매직 후 웨이브 자연스럽게 연출. 고객 만족도 높음.',
      next_visit_date: '2026-04-28', next_visit_note: '컬러 상담 예약됨',
      is_shared: false, share_token: 'a0000000-0000-0000-0000-000000000002',
    },
    {
      id: '40000000-0000-0000-0000-000000000003',
      shop_id: S1, client_id: C2, stylist_name: '김헤어', date: '2026-05-01',
      services: [{ type: 'cut', description: '투블럭 + 사이드 정리', price: 35000 }],
      hair_condition: '건강한 모발', scalp: '정상',
      notes: '2~3개월 주기로 방문. 스타일 유지 중.',
      next_visit_date: '2026-07-10', next_visit_note: '정기 컷',
      is_shared: false, share_token: 'a0000000-0000-0000-0000-000000000003',
    },
    {
      id: '40000000-0000-0000-0000-000000000004',
      shop_id: S1, client_id: C3, stylist_name: '박스타일', date: '2026-04-22',
      services: [{ type: 'bleach', description: '전체 블리치 2회', price: 150000 }, { type: 'color', description: '핑크 베이지 컬러', price: 80000 }, { type: 'treatment', description: 'Olaplex 3단계 트리트먼트', price: 60000 }],
      before_photo: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=500&fit=crop&q=80',
      after_photo:  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&q=80',
      hair_condition: '기존 손상 심함, Olaplex 병행 시술',
      color_formula: 'Blondor Freelights + 6% → 토너: Wella /65 + /56 + 1.9%',
      notes: '손상도 고려해 블리치 2회로 나눔. 집에서 Olaplex 3 주 2회 사용 권장.',
      next_visit_date: '2026-06-05', next_visit_note: '루트 블리치 및 토너 보정',
      is_shared: true, share_token: 'a0000000-0000-0000-0000-000000000004',
    },
    {
      id: '40000000-0000-0000-0000-000000000005',
      shop_id: S1, client_id: C4, stylist_name: '김헤어', date: '2026-04-10',
      services: [{ type: 'color', description: '새치 커버 다크 브라운', price: 60000 }, { type: 'cut', description: '정돈 컷', price: 30000 }],
      hair_condition: '새치 약 30%, 건강한 모발',
      color_formula: 'Wella 5/0 + 5/3 (70:30) + 6% (1:1.5)',
      notes: '자연스러운 커버 원하심. 완벽히 커버되지 않는 자연스러운 느낌 선호.',
      next_visit_date: '2026-06-25', next_visit_note: '뿌리 터치업',
      is_shared: false, share_token: 'a0000000-0000-0000-0000-000000000005',
    },
    {
      id: '40000000-0000-0000-0000-000000000006',
      shop_id: S2, client_id: C5, stylist_name: '정스타일', date: '2026-04-25',
      services: [{ type: 'bleach', description: '하이라이트 블리치', price: 120000 }, { type: 'color', description: '골드 베이지 토너', price: 60000 }],
      hair_condition: '탈색 이력 많아 다소 손상',
      color_formula: 'Blondor + 3% → 토너: Wella /3 + /0 + 1.9%',
      notes: '밝은 골드 베이지 원함. 자연광에서 아름답게 나옴.',
      next_visit_date: '2026-06-20', next_visit_note: '뿌리 하이라이트',
      is_shared: true, share_token: 'a0000000-0000-0000-0000-000000000006',
    },
    {
      id: '40000000-0000-0000-0000-000000000007',
      shop_id: S2, client_id: C6, stylist_name: '오컬러', date: '2026-04-30',
      services: [{ type: 'perm', description: 'C컬 볼륨 펌', price: 100000 }, { type: 'cut', description: '기본 컷', price: 25000 }],
      hair_condition: '건강한 모발, 펌 처음 시술',
      perm_formula: 'Shiseido 1제 2호, 20분 → 2제 15분',
      notes: '첫 펌으로 약한 웨이브 원함. 결과 만족도 높음.',
      is_shared: false, share_token: 'a0000000-0000-0000-0000-000000000007',
    },
    {
      id: '40000000-0000-0000-0000-000000000008',
      shop_id: S1, client_id: C1, stylist_name: '이드레스', date: '2025-10-15',
      services: [{ type: 'cut', description: '레이어드 컷 + 앞머리 정리', price: 45000 }, { type: 'scalp', description: '두피 스케일링', price: 40000 }],
      hair_condition: '두피 지성, 모발 보통', scalp: '지성 두피',
      notes: '두피 스케일링 후 환경 개선 필요. 산성 샴푸 권장.',
      is_shared: false, share_token: 'a0000000-0000-0000-0000-000000000008',
    },
    {
      id: '40000000-0000-0000-0000-000000000009',
      shop_id: S2, client_id: C1, stylist_name: '이드레스', date: '2026-03-20',
      services: [{ type: 'color', description: '내추럴 브라운 뿌리 염색', price: 65000 }, { type: 'treatment', description: '모이스처 트리트먼트', price: 35000 }],
      hair_condition: '뿌리 새치 10%, 전체적으로 건강',
      color_formula: 'Wella 5/07 + 5/3 (60:40) + 6% (1:1.5)',
      notes: '이직 후 첫 방문. 강남점 시절 이력 참고하여 자연스러운 커버 진행. 고객 만족.',
      next_visit_date: '2026-06-01', next_visit_note: '뿌리 터치업',
      is_shared: false, share_token: 'a0000000-0000-0000-0000-000000000009',
    },
  ], { onConflict: 'id' });
  if (conErr) return err('consultations', conErr);
  log.push('✓ consultations');

  // ── 5. 예약 ──────────────────────────────────────────────────
  const { error: bookErr } = await admin.from('bookings').upsert([
    { id: '50000000-0000-0000-0000-000000000001', shop_id: S1, client_id: C1, client_name: '김지수', requested_date: '2026-05-10', requested_time: '14:00', service_types: ['color','treatment'], preferred_designer: '박스타일', notes: '지난번처럼 애쉬 베이지로 부탁드려요.', status: 'pending' },
    { id: '50000000-0000-0000-0000-000000000002', shop_id: S1, client_id: C2, client_name: '이민준', requested_date: '2026-05-08', requested_time: '11:00', service_types: ['cut'],              preferred_designer: '김헤어',   notes: '', status: 'confirmed', confirmed_by: '김헤어' },
    { id: '50000000-0000-0000-0000-000000000003', shop_id: S1, client_id: C3, client_name: '박소연', requested_date: '2026-05-15', requested_time: '16:00', service_types: ['bleach','color'],   notes: '루트 블리치 + 토너 보정 원해요.', status: 'pending' },
    { id: '50000000-0000-0000-0000-000000000004', shop_id: S2, client_id: C5, client_name: '이소연', requested_date: '2026-05-12', requested_time: '13:00', service_types: ['bleach','color'],   preferred_designer: '정스타일', notes: '뿌리 하이라이트 추가해주세요.', status: 'pending' },
    { id: '50000000-0000-0000-0000-000000000005', shop_id: S2, client_id: C6, client_name: '강민서', requested_date: '2026-05-14', requested_time: '15:00', service_types: ['perm'],             notes: '', status: 'confirmed', confirmed_by: '오컬러' },
  ], { onConflict: 'id' });
  if (bookErr) return err('bookings', bookErr);
  log.push('✓ bookings');

  // ── 6. Auth 계정 생성 + designer/client 링크 ─────────────────
  for (const u of DEMO_USERS) {
    // 이미 존재하는 계정인지 확인
    const { data: existing } = await admin.auth.admin.listUsers();
    const found = existing?.users?.find((au: { email?: string }) => au.email === u.email);

    let authUserId: string;
    if (found) {
      authUserId = found.id;
      log.push(`~ auth already exists: ${u.email}`);
    } else {
      const meta: Record<string, unknown> = {
        name:   u.name,
        role:   u.role,
        shopId: u.shopId,
      };
      if (u.designerId)   { meta.designerId = u.designerId; meta.designerName = u.designerName ?? u.name; }
      if (u.clientId)     { meta.clientId   = u.clientId; }

      const { data: created, error: authErr } = await admin.auth.admin.createUser({
        email:          u.email,
        password:       DEMO_PASS,
        user_metadata:  meta,
        email_confirm:  true,
      });
      if (authErr) { log.push(`✗ auth ${u.email}: ${authErr.message}`); continue; }
      authUserId = created.user.id;
      log.push(`✓ auth created: ${u.email}`);
    }

    // designer 테이블에 auth_user_id 연결
    if (u.designerId) {
      await admin.from('designers')
        .update({ auth_user_id: authUserId })
        .eq('id', u.designerId);
    }
    // clients 테이블에 auth_user_id 연결 (고객)
    if (u.clientId) {
      await admin.from('clients')
        .update({ auth_user_id: authUserId })
        .eq('id', u.clientId);
    }
  }
  log.push('✓ auth accounts');

  return new Response(JSON.stringify({ ok: true, log }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

function err(table: string, e: { message: string }) {
  return new Response(JSON.stringify({ error: `${table}: ${e.message}` }), {
    status: 500, headers: { 'Content-Type': 'application/json' },
  });
}
