import { Client, Consultation, AuthUser, Designer, Booking, Shop } from '../types';

// ── 지점 (미용실) ──────────────────────────────────────────────
export const mockShops: Shop[] = [
  {
    id: 's1',
    name: '헤어 짤 강남점',
    address: '서울시 강남구 테헤란로 123',
    phone: '02-1234-5678',
    createdAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 's2',
    name: '헤어 짤 홍대점',
    address: '서울시 마포구 홍익로 45',
    phone: '02-9876-5432',
    createdAt: '2023-06-01T00:00:00Z',
  },
];

// ── 데모 로그인 계정 ───────────────────────────────────────────
export const demoUsers: AuthUser[] = [
  // ── 강남점 ──
  {
    id: 'u1',
    shopId: 's1',
    name: '김지수',
    role: 'customer',
    email: 'jisoo@example.com',
    password: '1234',
    clientId: 'c1',
  },
  {
    id: 'u2',
    shopId: 's1',
    name: '박스타일',
    role: 'designer',
    email: 'park@hairjjal.com',
    password: '1234',
    designerName: '박스타일',
    designerId: 'd1',
  },
  {
    id: 'u3',
    shopId: 's1',
    name: '김헤어',
    role: 'designer',
    email: 'kim@hairjjal.com',
    password: '1234',
    designerName: '김헤어',
    designerId: 'd2',
  },
  {
    id: 'u4',
    shopId: 's1',
    name: '홍원장',
    role: 'owner',
    email: 'owner@hairjjal.com',
    password: '1234',
    designerName: '홍원장',
    designerId: 'd6',
  },
  // ── 홍대점 ──
  {
    id: 'u5',
    shopId: 's2',
    name: '이소연',
    role: 'customer',
    email: 'soyeon@example.com',
    password: '1234',
    clientId: 'c5',
  },
  {
    id: 'u6',
    shopId: 's2',
    name: '정스타일',
    role: 'designer',
    email: 'jeong@hairjjal.com',
    password: '1234',
    designerName: '정스타일',
    designerId: 'd4',
  },
  {
    id: 'u8',                          // 오컬러 — Designer 레코드(d5)와 연결
    shopId: 's2',
    name: '오컬러',
    role: 'designer',
    email: 'oh@hairjjal.com',
    password: '1234',
    designerName: '오컬러',
    designerId: 'd5',
  },
  {
    id: 'u7',
    shopId: 's2',
    name: '최원장',
    role: 'owner',
    email: 'owner2@hairjjal.com',
    password: '1234',
    designerName: '최원장',
    designerId: 'd7',
  },
];

// ── 디자이너 ───────────────────────────────────────────────────
export const mockDesigners: Designer[] = [
  // 강남점
  { id: 'd1', shopId: 's1', name: '박스타일',  email: 'park@hairjjal.com',  phone: '010-1111-2222', status: 'active',   joinedAt: '2023-03-01' },
  { id: 'd2', shopId: 's1', name: '김헤어',    email: 'kim@hairjjal.com',   phone: '010-3333-4444', status: 'active',   joinedAt: '2024-01-15' },
  { id: 'd3', shopId: 's1', name: '이드레스',  email: 'lee@hairjjal.com',   phone: '010-5555-6666', status: 'inactive', joinedAt: '2022-06-01', leftAt: '2025-12-31', leftReason: '이직' },
  // 홍대점
  { id: 'd4', shopId: 's2', name: '정스타일',  email: 'jeong@hairjjal.com', phone: '010-7777-8888', status: 'active',   joinedAt: '2023-06-01' },
  { id: 'd5', shopId: 's2', name: '오컬러',    email: 'oh@hairjjal.com',    phone: '010-9999-0000', status: 'active',   joinedAt: '2024-03-01' },
  // 원장 (각 지점 대표)
  { id: 'd6', shopId: 's1', name: '홍원장',    email: 'owner@hairjjal.com', phone: '010-0001-1111', status: 'active',   joinedAt: '2023-01-01' },
  { id: 'd7', shopId: 's2', name: '최원장',    email: 'owner2@hairjjal.com',phone: '010-0002-2222', status: 'active',   joinedAt: '2023-06-01' },
];

// ── 고객 ───────────────────────────────────────────────────────
export const mockClients: Client[] = [
  // 강남점 고객
  {
    id: 'c1', shopId: 's1',
    name: '김지수', phone: '010-1234-5678', email: 'jisoo@example.com',
    birthDate: '1995-03-15', gender: 'female',
    notes: '두피 민감, 산성 샴푸 사용 권장',
    tags: ['단골', 'VIP'],
    createdAt: '2024-01-10T09:00:00Z',
  },
  {
    id: 'c2', shopId: 's1',
    name: '이민준', phone: '010-9876-5432', email: 'minjun@example.com',
    birthDate: '1990-07-22', gender: 'male',
    notes: '모발 굵고 빳빳함, 컷만 선호',
    tags: ['정기방문'],
    createdAt: '2024-02-05T10:00:00Z',
  },
  {
    id: 'c3', shopId: 's1',
    name: '박소연', phone: '010-5555-7777',
    gender: 'female', birthDate: '1998-11-08',
    notes: '손상모, 트리트먼트 필수',
    tags: ['손상모', '단골'],
    createdAt: '2024-03-01T11:00:00Z',
  },
  {
    id: 'c4', shopId: 's1',
    name: '최현우', phone: '010-3333-4444',
    gender: 'male', birthDate: '1988-05-30',
    notes: '새치 있음, 자연스러운 컬러 선호',
    tags: ['새치커버'],
    createdAt: '2024-04-12T14:00:00Z',
  },
  // 홍대점 고객
  {
    id: 'c5', shopId: 's2',
    name: '이소연', phone: '010-2222-3333', email: 'soyeon@example.com',
    birthDate: '1997-05-20', gender: 'female',
    notes: '밝은 컬러 선호, 탈색 이력 많음',
    tags: ['단골', 'VIP'],
    createdAt: '2024-02-01T09:00:00Z',
  },
  {
    id: 'c6', shopId: 's2',
    name: '강민서', phone: '010-4444-5555',
    gender: 'female', birthDate: '2000-09-15',
    notes: '첫 방문 고객, 펌 관심',
    tags: [],
    createdAt: '2024-05-10T10:00:00Z',
  },
];

// ── 상담 이력 ──────────────────────────────────────────────────
export const mockConsultations: Consultation[] = [
  // 강남점
  {
    id: 'con1', shopId: 's1', clientId: 'c1',
    date: '2026-04-28', stylistName: '박스타일',
    services: [
      { type: 'color',     description: '버진 블리치 + 애쉬 베이지 컬러', price: 180000 },
      { type: 'treatment', description: '케라틴 트리트먼트',              price: 50000  },
    ],
    beforePhoto: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=500&fit=crop&q=80',
    afterPhoto:  'https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=400&h=500&fit=crop&q=80',
    hairCondition: '모발 상태 보통, 기존 펌 손상 있음',
    scalp: '지성 두피, 예민하지 않음',
    colorFormula: 'Wella 12/61 + Blondor + 9% (1:2) → 토너: 10/16 + 8/69 (50:50) + 1.9%',
    notes: '고객이 쿨톤 애쉬 베이지 원함. 다음 방문 시 토너 보정 필요.',
    nextVisitDate: '2026-06-15', nextVisitNote: '토너 보정 및 뿌리 염색',
    shareToken: 'share-abc123', isShared: true,
    createdAt: '2026-04-28T14:00:00Z',
  },
  {
    id: 'con2', shopId: 's1', clientId: 'c1',
    date: '2026-01-18', stylistName: '박스타일',
    services: [
      { type: 'cut',  description: '레이어드 컷 + 앞머리', price: 40000  },
      { type: 'perm', description: '볼륨 매직 (반매직)',   price: 130000 },
    ],
    hairCondition: '약간 건조, 끝부분 손상',
    scalp: '정상',
    permFormula: 'Milbon Ordeve 2제 사용, 두상 상단 20분 / 끝 15분',
    notes: '반매직 후 웨이브 자연스럽게 연출. 고객 만족도 높음.',
    nextVisitDate: '2026-04-28', nextVisitNote: '컬러 상담 예약됨',
    shareToken: 'share-def456', isShared: false,
    createdAt: '2026-01-18T15:00:00Z',
  },
  {
    id: 'con3', shopId: 's1', clientId: 'c2',
    date: '2026-05-01', stylistName: '김헤어',
    services: [{ type: 'cut', description: '투블럭 + 사이드 정리', price: 35000 }],
    hairCondition: '건강한 모발', scalp: '정상',
    notes: '2~3개월 주기로 방문. 스타일 유지 중.',
    nextVisitDate: '2026-07-10', nextVisitNote: '정기 컷',
    shareToken: 'share-ghi789', isShared: false,
    createdAt: '2026-05-01T11:00:00Z',
  },
  {
    id: 'con4', shopId: 's1', clientId: 'c3',
    date: '2026-04-22', stylistName: '박스타일',
    services: [
      { type: 'bleach',    description: '전체 블리치 2회',                  price: 150000 },
      { type: 'color',     description: '핑크 베이지 컬러',                 price: 80000  },
      { type: 'treatment', description: 'Olaplex 3단계 트리트먼트',         price: 60000  },
    ],
    beforePhoto: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=500&fit=crop&q=80',
    afterPhoto:  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&q=80',
    hairCondition: '기존 손상 심함, Olaplex 병행 시술',
    colorFormula: 'Blondor Freelights + 6% → 토너: Wella /65 + /56 + 1.9%',
    notes: '손상도 고려해 블리치 2회로 나눔. 집에서 Olaplex 3 주 2회 사용 권장.',
    nextVisitDate: '2026-06-05', nextVisitNote: '루트 블리치 및 토너 보정',
    shareToken: 'share-jkl012', isShared: true,
    createdAt: '2026-04-22T13:00:00Z',
  },
  {
    id: 'con5', shopId: 's1', clientId: 'c4',
    date: '2026-04-10', stylistName: '김헤어',
    services: [
      { type: 'color', description: '새치 커버 다크 브라운', price: 60000 },
      { type: 'cut',   description: '정돈 컷',               price: 30000 },
    ],
    hairCondition: '새치 약 30%, 건강한 모발',
    colorFormula: 'Wella 5/0 + 5/3 (70:30) + 6% (1:1.5)',
    notes: '자연스러운 커버 원하심. 완벽히 커버되지 않는 자연스러운 느낌 선호.',
    nextVisitDate: '2026-06-25', nextVisitNote: '뿌리 터치업',
    shareToken: 'share-mno345', isShared: false,
    createdAt: '2026-04-10T10:00:00Z',
  },
  // 홍대점
  {
    id: 'con6', shopId: 's2', clientId: 'c5',
    date: '2026-04-25', stylistName: '정스타일',
    services: [
      { type: 'bleach', description: '하이라이트 블리치',      price: 120000 },
      { type: 'color',  description: '골드 베이지 토너',       price: 60000  },
    ],
    hairCondition: '탈색 이력 많아 다소 손상',
    colorFormula: 'Blondor + 3% → 토너: Wella /3 + /0 + 1.9%',
    notes: '밝은 골드 베이지 원함. 자연광에서 아름답게 나옴.',
    nextVisitDate: '2026-06-20', nextVisitNote: '뿌리 하이라이트',
    shareToken: 'share-pqr678', isShared: true,
    createdAt: '2026-04-25T13:00:00Z',
  },
  {
    id: 'con7', shopId: 's2', clientId: 'c6',
    date: '2026-04-30', stylistName: '오컬러',
    services: [
      { type: 'perm', description: 'C컬 볼륨 펌', price: 100000 },
      { type: 'cut',  description: '기본 컷',      price: 25000  },
    ],
    hairCondition: '건강한 모발, 펌 처음 시술',
    permFormula: 'Shiseido 1제 2호, 20분 → 2제 15분',
    notes: '첫 펌으로 약한 웨이브 원함. 결과 만족도 높음.',
    shareToken: 'share-stu901', isShared: false,
    createdAt: '2026-04-30T11:00:00Z',
  },
];

// ── 예약 ───────────────────────────────────────────────────────
export const mockBookings: Booking[] = [
  // 강남점
  {
    id: 'b1', shopId: 's1', clientId: 'c1', clientName: '김지수',
    requestedDate: '2026-05-10', requestedTime: '14:00',
    serviceTypes: ['color', 'treatment'], preferredDesigner: '박스타일',
    notes: '지난번처럼 애쉬 베이지로 부탁드려요.',
    status: 'pending',
    createdAt: '2026-05-01T09:00:00Z',
  },
  {
    id: 'b2', shopId: 's1', clientId: 'c2', clientName: '이민준',
    requestedDate: '2026-05-08', requestedTime: '11:00',
    serviceTypes: ['cut'], preferredDesigner: '김헤어',
    notes: '',
    status: 'confirmed', confirmedBy: '김헤어',
    createdAt: '2026-04-30T15:00:00Z',
  },
  {
    id: 'b3', shopId: 's1', clientId: 'c3', clientName: '박소연',
    requestedDate: '2026-05-15', requestedTime: '16:00',
    serviceTypes: ['bleach', 'color'],
    notes: '루트 블리치 + 토너 보정 원해요.',
    status: 'pending',
    createdAt: '2026-05-01T11:00:00Z',
  },
  // 홍대점
  {
    id: 'b4', shopId: 's2', clientId: 'c5', clientName: '이소연',
    requestedDate: '2026-05-12', requestedTime: '13:00',
    serviceTypes: ['bleach', 'color'], preferredDesigner: '정스타일',
    notes: '뿌리 하이라이트 추가해주세요.',
    status: 'pending',
    createdAt: '2026-05-02T10:00:00Z',
  },
  {
    id: 'b5', shopId: 's2', clientId: 'c6', clientName: '강민서',
    requestedDate: '2026-05-14', requestedTime: '15:00',
    serviceTypes: ['perm'],
    notes: '',
    status: 'confirmed', confirmedBy: '오컬러',
    createdAt: '2026-05-02T14:00:00Z',
  },
];
