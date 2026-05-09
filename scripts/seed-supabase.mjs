/**
 * Hair JJaL — Supabase 테스트 데이터 시드 스크립트
 * 실행: node scripts/seed-supabase.mjs
 * ⚠️ 서비스 롤 키 사용 — 절대 git commit 하지 말 것
 */

const SUPABASE_URL = 'https://wqobpvqlcyshvsextqvj.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxb2JwdnFsY3lzaHZzZXh0cXZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI2NjU0NywiZXhwIjoyMDkzODQyNTQ3fQ.1_z3SpaefbY0-KipDpQvNwyIGxZVkXn-fR6lw3vGZGs';
const PASSWORD     = 'HairJJaL1234!';

const authHeaders = {
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'apikey':        SERVICE_KEY,
  'Content-Type':  'application/json',
};

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────

async function createUser(email, meta) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      email,
      password:      PASSWORD,
      email_confirm: true,          // 이메일 인증 없이 바로 활성화
      user_metadata: meta,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`createUser(${email}): ${JSON.stringify(data)}`);
  console.log(`  ✅ Auth 계정 생성: ${email} (${data.id})`);
  return data.id; // auth user id
}

async function insert(table, rows) {
  const body = Array.isArray(rows) ? rows : [rows];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  'POST',
    headers: { ...authHeaders, 'Prefer': 'return=representation' },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`insert(${table}): ${JSON.stringify(data)}`);
  console.log(`  ✅ ${table} 삽입: ${body.length}건`);
  return data;
}

// ── 메인 ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Hair JJaL 테스트 데이터 시드 시작\n');

  // ── Shop 1: 강남점 ──────────────────────────────────────────────────────────
  console.log('📍 [Shop 1] Hair JJaL 강남점');
  const [shop1] = await insert('shops', {
    name:          'Hair JJaL 강남점',
    address:       '서울 강남구 테헤란로 123',
    phone:         '02-1234-5678',
    open_time:     '10:00',
    close_time:    '20:00',
    slot_interval: 30,
  });
  const shop1Id = shop1.id;
  console.log(`  Shop ID: ${shop1Id}`);

  // 원장 1
  console.log('\n  👑 원장 1: 김지현');
  const [des1_rec] = await insert('designers', {
    shop_id:   shop1Id,
    name:      '김지현',
    email:     'owner1@hairjjal.com',
    phone:     '010-1111-2222',
    role:      'owner',
    status:    'active',
    joined_at: '2023-01-01',
  });
  const owner1AuthId = await createUser('owner1@hairjjal.com', {
    shopId:      shop1Id,
    name:        '김지현',
    role:        'owner',
    designerName:'김지현',
    designerId:  des1_rec.id,
  });
  // auth_user_id 업데이트
  await fetch(`${SUPABASE_URL}/rest/v1/designers?id=eq.${des1_rec.id}`, {
    method: 'PATCH', headers: { ...authHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ auth_user_id: owner1AuthId }),
  });

  // 디자이너 1
  console.log('\n  💇 디자이너 1: 이지수');
  const [des2_rec] = await insert('designers', {
    shop_id:   shop1Id,
    name:      '이지수',
    email:     'jisoo@hairjjal.com',
    phone:     '010-2222-3333',
    role:      'staff',
    status:    'active',
    joined_at: '2023-03-15',
  });
  const jisooAuthId = await createUser('jisoo@hairjjal.com', {
    shopId:      shop1Id,
    name:        '이지수',
    role:        'designer',
    designerName:'이지수',
    designerId:  des2_rec.id,
  });
  await fetch(`${SUPABASE_URL}/rest/v1/designers?id=eq.${des2_rec.id}`, {
    method: 'PATCH', headers: { ...authHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ auth_user_id: jisooAuthId }),
  });

  // 디자이너 2
  console.log('\n  💇 디자이너 2: 박민준');
  const [des3_rec] = await insert('designers', {
    shop_id:   shop1Id,
    name:      '박민준',
    email:     'minjun@hairjjal.com',
    phone:     '010-3333-4444',
    role:      'staff',
    status:    'active',
    joined_at: '2023-06-01',
  });
  const minjunAuthId = await createUser('minjun@hairjjal.com', {
    shopId:      shop1Id,
    name:        '박민준',
    role:        'designer',
    designerName:'박민준',
    designerId:  des3_rec.id,
  });
  await fetch(`${SUPABASE_URL}/rest/v1/designers?id=eq.${des3_rec.id}`, {
    method: 'PATCH', headers: { ...authHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ auth_user_id: minjunAuthId }),
  });

  // 고객 1, 2
  console.log('\n  👥 고객 2명 (강남점)');
  const [client1, client2] = await insert('clients', [
    {
      shop_id:    shop1Id,
      name:       '홍길동',
      phone:      '010-5555-1111',
      email:      'client1@test.com',
      gender:     'male',
      tags:       ['단골', 'VIP'],
    },
    {
      shop_id:    shop1Id,
      name:       '김민지',
      phone:      '010-5555-2222',
      email:      'client2@test.com',
      gender:     'female',
      tags:       ['신규'],
    },
  ]);

  // ── Shop 2: 서초점 ──────────────────────────────────────────────────────────
  console.log('\n\n📍 [Shop 2] Hair JJaL 서초점');
  const [shop2] = await insert('shops', {
    name:          'Hair JJaL 서초점',
    address:       '서울 서초구 서초대로 456',
    phone:         '02-9876-5432',
    open_time:     '09:00',
    close_time:    '19:00',
    slot_interval: 30,
  });
  const shop2Id = shop2.id;
  console.log(`  Shop ID: ${shop2Id}`);

  // 원장 2
  console.log('\n  👑 원장 2: 최서준');
  const [des4_rec] = await insert('designers', {
    shop_id:   shop2Id,
    name:      '최서준',
    email:     'owner2@hairjjal.com',
    phone:     '010-6666-7777',
    role:      'owner',
    status:    'active',
    joined_at: '2022-06-01',
  });
  const owner2AuthId = await createUser('owner2@hairjjal.com', {
    shopId:      shop2Id,
    name:        '최서준',
    role:        'owner',
    designerName:'최서준',
    designerId:  des4_rec.id,
  });
  await fetch(`${SUPABASE_URL}/rest/v1/designers?id=eq.${des4_rec.id}`, {
    method: 'PATCH', headers: { ...authHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ auth_user_id: owner2AuthId }),
  });

  // 디자이너 3
  console.log('\n  💇 디자이너 3: 최수아');
  const [des5_rec] = await insert('designers', {
    shop_id:   shop2Id,
    name:      '최수아',
    email:     'sua@hairjjal.com',
    phone:     '010-7777-8888',
    role:      'staff',
    status:    'active',
    joined_at: '2022-09-01',
  });
  const suaAuthId = await createUser('sua@hairjjal.com', {
    shopId:      shop2Id,
    name:        '최수아',
    role:        'designer',
    designerName:'최수아',
    designerId:  des5_rec.id,
  });
  await fetch(`${SUPABASE_URL}/rest/v1/designers?id=eq.${des5_rec.id}`, {
    method: 'PATCH', headers: { ...authHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ auth_user_id: suaAuthId }),
  });

  // 디자이너 4
  console.log('\n  💇 디자이너 4: 정다은');
  const [des6_rec] = await insert('designers', {
    shop_id:   shop2Id,
    name:      '정다은',
    email:     'daeun@hairjjal.com',
    phone:     '010-8888-9999',
    role:      'staff',
    status:    'active',
    joined_at: '2023-02-01',
  });
  const daeunAuthId = await createUser('daeun@hairjjal.com', {
    shopId:      shop2Id,
    name:        '정다은',
    role:        'designer',
    designerName:'정다은',
    designerId:  des6_rec.id,
  });
  await fetch(`${SUPABASE_URL}/rest/v1/designers?id=eq.${des6_rec.id}`, {
    method: 'PATCH', headers: { ...authHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ auth_user_id: daeunAuthId }),
  });

  // 고객 3, 4
  console.log('\n  👥 고객 2명 (서초점)');
  await insert('clients', [
    {
      shop_id:    shop2Id,
      name:       '이영희',
      phone:      '010-9999-1111',
      email:      'client3@test.com',
      gender:     'female',
      tags:       ['단골'],
    },
    {
      shop_id:    shop2Id,
      name:       '최준호',
      phone:      '010-9999-2222',
      email:      'client4@test.com',
      gender:     'male',
      tags:       ['신규', '펌'],
    },
  ]);

  // ── 완료 요약 ────────────────────────────────────────────────────────────────
  console.log('\n\n🎉 시드 완료! 테스트 계정 목록\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('공통 비밀번호: HairJJaL1234!\n');
  console.log('[강남점]');
  console.log('  원장  | 김지현 | owner1@hairjjal.com');
  console.log('  디자이너 | 이지수 | jisoo@hairjjal.com');
  console.log('  디자이너 | 박민준 | minjun@hairjjal.com');
  console.log('  고객  | 홍길동 | (이메일 로그인 없음)');
  console.log('  고객  | 김민지 | (이메일 로그인 없음)');
  console.log('\n[서초점]');
  console.log('  원장  | 최서준 | owner2@hairjjal.com');
  console.log('  디자이너 | 최수아 | sua@hairjjal.com');
  console.log('  디자이너 | 정다은 | daeun@hairjjal.com');
  console.log('  고객  | 이영희 | (이메일 로그인 없음)');
  console.log('  고객  | 최준호 | (이메일 로그인 없음)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed().catch(err => {
  console.error('\n❌ 오류:', err.message);
  process.exit(1);
});
