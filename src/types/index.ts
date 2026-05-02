/** 미용실 지점 */
export interface Shop {
  id: string;
  name: string;      // 지점명 (예: 헤어 짤 강남점)
  address?: string;
  phone?: string;
  openTime?: string;    // HH:MM, 기본값 '10:00'
  closeTime?: string;   // HH:MM, 기본값 '19:00'
  slotInterval?: number; // 분 단위, 기본값 30
  createdAt: string;
}

export interface Client {
  id: string;
  /** 최초 등록 지점 (선택). 고객은 어느 지점이든 독립적으로 방문 가능 */
  shopId?: string;
  name: string;
  phone: string;
  email?: string;
  birthDate?: string;
  gender: 'female' | 'male' | 'other';
  profileImage?: string;
  notes?: string;
  createdAt: string;
  tags?: string[];
}

export type ServiceType =
  | 'cut'
  | 'color'
  | 'bleach'
  | 'perm'
  | 'straightening'
  | 'treatment'
  | 'scalp'
  | 'styling'
  | 'other';

export interface Service {
  type: ServiceType;
  description: string;
  price?: number;
}

/** 고객이 디자이너에게 기록 수정·삭제를 요청할 때 저장 */
export interface ModificationRequest {
  type: 'edit' | 'delete';
  message?: string;
  requestedAt: string;   // ISO string
}

export interface Consultation {
  id: string;
  /** 시술이 이뤄진 지점 (venue 기록용). 소유권은 디자이너·고객에게 있음 */
  shopId: string;
  clientId: string;
  date: string;
  stylistName: string;
  services: Service[];
  beforePhoto?: string;
  afterPhoto?: string;
  hairCondition: string;
  scalp?: string;
  colorFormula?: string;
  permFormula?: string;
  notes: string;
  nextVisitDate?: string;
  nextVisitNote?: string;
  shareToken: string;
  isShared: boolean;
  createdAt: string;
  /** 고객이 수정·삭제를 요청한 경우 저장. 디자이너가 처리 후 제거 */
  modificationRequest?: ModificationRequest;
}

export type UserRole = 'customer' | 'designer' | 'owner';

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: '고객',
  designer: '헤어디자이너',
  owner: '원장',
};

export interface AuthUser {
  id: string;
  shopId: string;        // 소속 지점
  name: string;
  role: UserRole;
  email: string;
  password?: string; // demo only — never persisted in session storage
  avatar?: string;
  clientId?: string;     // customer: linked client record
  designerName?: string; // designer/owner: matches stylistName in consultations
  designerId?: string;   // designer/owner: links to Designer.id
}

export type DesignerRole = 'staff' | 'manager';

export interface Designer {
  id: string;
  shopId: string;    // 소속 지점
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  joinedAt: string;
  leftAt?: string;
  leftReason?: string;
  // 3-2: 권한 세분화
  role?: DesignerRole;           // 기본값 'staff'
  // 1-2: 프로필 카드
  bio?: string;                  // 한 줄 소개
  specialties?: ServiceType[];   // 전문 시술
  avatar?: string;               // base64 또는 URL
  // 3-4: 근무 스케줄
  workDays?: number[];           // 0=일 ~ 6=토 (없으면 모든 요일)
  dayOff?: string[];             // YYYY-MM-DD 특정 휴무일
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  shopId: string;    // 소속 지점
  clientId: string;
  clientName: string;
  requestedDate: string;   // YYYY-MM-DD
  requestedTime: string;   // HH:MM
  serviceTypes: ServiceType[];
  preferredDesigner?: string;
  notes?: string;
  status: BookingStatus;
  confirmedBy?: string;    // designer name who confirmed
  cancelReason?: string;
  createdAt: string;
}

export type View =
  | 'dashboard'
  | 'clients'
  | 'client-detail'
  | 'consultation-detail'
  | 'customer-home'
  | 'customer-consultation'
  | 'customer-booking'
  | 'bookings'
  | 'owner-staff'
  | 'profile'
  | 'share';

export interface AppState {
  clients: Client[];
  consultations: Consultation[];
  shops: Shop[];
  currentView: View;
  selectedClientId: string | null;
  selectedConsultationId: string | null;
  shareToken: string | null;
}
