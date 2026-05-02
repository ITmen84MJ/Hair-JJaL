/** 미용실 지점 */
export interface Shop {
  id: string;
  name: string;      // 지점명 (예: 헤어 짤 강남점)
  address?: string;
  phone?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  shopId: string;    // 소속 지점
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

export interface Consultation {
  id: string;
  shopId: string;    // 소속 지점
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
  password: string; // demo only — plain text
  avatar?: string;
  clientId?: string;     // customer: linked client record
  designerName?: string; // designer/owner: matches stylistName in consultations
  designerId?: string;   // designer/owner: links to Designer.id
}

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
