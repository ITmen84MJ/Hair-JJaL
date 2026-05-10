/**
 * useLocalStore — localStorage 기반 CRUD
 * 모든 뮤테이션 함수가 Promise 를 반환하여 useSupabaseStore 와 인터페이스를 통일한다.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Client, Consultation, Designer, Booking, Shop } from '../types';
import { mockClients, mockConsultations, mockDesigners, mockBookings, mockShops } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';
import { toast } from './useToast';
import { getStorageUsage } from '../utils/backup';

const STORAGE_WARN_KEY       = 'hairjjal_storage_warn_at';
const STORAGE_WARN_THRESHOLD = 80;
const STORAGE_WARN_COOLDOWN  = 60 * 60 * 1000;

function checkStorageAndWarn() {
  try {
    const { percent } = getStorageUsage();
    if (percent < STORAGE_WARN_THRESHOLD) return;
    const lastWarn = Number(localStorage.getItem(STORAGE_WARN_KEY) ?? 0);
    if (Date.now() - lastWarn < STORAGE_WARN_COOLDOWN) return;
    localStorage.setItem(STORAGE_WARN_KEY, String(Date.now()));
    toast.warning(`저장 공간이 ${Math.round(percent)}% 사용되었습니다. 데이터 백업을 권장합니다.`, 6000);
  } catch {}
}

export const STORAGE_KEY  = 'hairlog_data';
export const DATA_VERSION = 4;

/** 빈 초기 상태 — 실사용 기본값 */
const EMPTY_DEFAULTS = () => ({
  clients: [], consultations: [], designers: [], bookings: [], shops: [],
});

/** 데모 데이터 — loginAs() 호출 시에만 명시적으로 로드 */
export const MOCK_DEFAULTS = () => ({
  clients: mockClients, consultations: mockConsultations,
  designers: mockDesigners, bookings: mockBookings, shops: mockShops,
});

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p.version !== DATA_VERSION) { localStorage.removeItem(STORAGE_KEY); return EMPTY_DEFAULTS(); }
      return {
        clients:       p.clients       ?? [],
        consultations: p.consultations ?? [],
        designers:     p.designers     ?? [],
        bookings:      p.bookings      ?? [],
        shops:         p.shops         ?? [],
      };
    }
  } catch {}
  // localStorage 에 데이터 없음 = 새 사용자 → 빈 상태로 시작
  return EMPTY_DEFAULTS();
}

const initialData = loadFromStorage();

export function useLocalStore() {
  const [clients,       setClients]       = useState<Client[]>      (initialData.clients);
  const [consultations, setConsultations] = useState<Consultation[]>(initialData.consultations);
  const [designers,     setDesigners]     = useState<Designer[]>    (initialData.designers);
  const [bookings,      setBookings]      = useState<Booking[]>     (initialData.bookings);
  const [shops,         setShops]         = useState<Shop[]>        (initialData.shops);

  const isMounted = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: DATA_VERSION, clients, consultations, designers, bookings, shops,
      }));
      checkStorageAndWarn();
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [clients, consultations, designers, bookings, shops]);

  // ── Clients ──────────────────────────────────────────────────────────────
  const addClient = useCallback(async (data: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    const client: Client = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    setClients(prev => [...prev, client]);
    toast.success(`${client.name} 고객이 등록되었습니다.`);
    return client;
  }, []);

  const updateClient = useCallback(async (id: string, data: Partial<Client>): Promise<void> => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteClient = useCallback(async (id: string): Promise<void> => {
    setClients(prev => {
      const target = prev.find(c => c.id === id);
      if (target) toast.info(`${target.name} 고객 정보가 삭제되었습니다.`);
      return prev.filter(c => c.id !== id);
    });
    setConsultations(prev => prev.filter(c => c.clientId !== id));
    setBookings(prev => prev.filter(b => b.clientId !== id));
  }, []);

  // ── Consultations ────────────────────────────────────────────────────────
  const addConsultation = useCallback(async (
    data: Omit<Consultation, 'id' | 'shareToken' | 'createdAt'>,
  ): Promise<Consultation> => {
    const consultation: Consultation = {
      ...data, id: uuidv4(), shareToken: uuidv4(), createdAt: new Date().toISOString(),
    };
    setConsultations(prev => [...prev, consultation]);
    toast.success('상담이 저장되었습니다.');
    return consultation;
  }, []);

  const updateConsultation = useCallback(async (id: string, data: Partial<Consultation>): Promise<void> => {
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    const keys = Object.keys(data);
    const isSilent = keys.length === 1 && (keys[0] === 'modificationRequest' || keys[0] === 'isShared');
    if (!isSilent) toast.success('상담이 수정되었습니다.');
  }, []);

  const deleteConsultation = useCallback(async (id: string): Promise<void> => {
    setConsultations(prev => prev.filter(c => c.id !== id));
    toast.info('상담이 삭제되었습니다.');
  }, []);

  const toggleShare = useCallback(async (id: string): Promise<void> => {
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, isShared: !c.isShared } : c));
  }, []);

  // ── Designers ────────────────────────────────────────────────────────────
  // DATA-07: authUserId 파라미터 수용 (localStorage 모드에서는 무시 — 인터페이스 통일)
  const addDesigner = useCallback(async (
    data: Omit<Designer, 'id'> & { authUserId?: string },
  ): Promise<Designer> => {
    const { authUserId: _ignored, ...rest } = data; // eslint-disable-line @typescript-eslint/no-unused-vars
    const designer: Designer = { ...rest, id: uuidv4() };
    setDesigners(prev => [...prev, designer]);
    return designer;
  }, []);

  // DATA-07: authUserId 파라미터 수용 (localStorage 모드에서는 무시)
  const updateDesigner = useCallback(async (
    id: string,
    data: Partial<Designer> & { authUserId?: string },
  ): Promise<void> => {
    if (data.name !== undefined) {
      setDesigners(prev => {
        const oldName = prev.find(d => d.id === id)?.name;
        if (oldName && oldName !== data.name) {
          setConsultations(cs => cs.map(c =>
            c.stylistName === oldName ? { ...c, stylistName: data.name as string } : c
          ));
        }
        return prev.map(d => d.id === id ? { ...d, ...data } : d);
      });
    } else {
      setDesigners(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    }
    if (data.status === 'inactive') toast.info('퇴직 처리되었습니다.');
    else if (data.status === 'active' && !Object.keys(data).some(k => !['status', 'leftAt', 'leftReason'].includes(k))) toast.success('재활성화되었습니다.');
    else toast.success('디자이너 정보가 저장되었습니다.');
  }, []);

  // ── Bookings ─────────────────────────────────────────────────────────────
  const addBooking = useCallback(async (data: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> => {
    const booking: Booking = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    setBookings(prev => [...prev, booking]);
    toast.success('예약이 신청되었습니다. 확정 후 알려드립니다.');
    return booking;
  }, []);

  const updateBooking = useCallback(async (id: string, data: Partial<Booking>): Promise<void> => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
    if (data.status === 'confirmed') toast.success('예약이 확정되었습니다.');
    else if (data.status === 'cancelled') toast.info('예약이 취소되었습니다.');
  }, []);

  // ── Shops ─────────────────────────────────────────────────────────────────
  const addShop = useCallback(async (data: Omit<Shop, 'id' | 'createdAt'>): Promise<Shop> => {
    const shop: Shop = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    setShops(prev => [...prev, shop]);
    return shop;
  }, []);

  const updateShop = useCallback(async (id: string, data: Partial<Shop>): Promise<void> => {
    setShops(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    toast.success('지점 정보가 저장되었습니다.');
  }, []);

  /** 데모 계정 진입 시 호출 — mock 데이터를 스토어에 로드 */
  const loadDemoData = useCallback(() => {
    const demo = MOCK_DEFAULTS();
    setClients(demo.clients);
    setConsultations(demo.consultations);
    setDesigners(demo.designers);
    setBookings(demo.bookings);
    setShops(demo.shops);
  }, []);

  return {
    clients, consultations, designers, bookings, shops,
    isLoading: false,
    addClient, updateClient, deleteClient,
    addConsultation, updateConsultation, deleteConsultation, toggleShare,
    addDesigner, updateDesigner,
    addBooking, updateBooking,
    addShop, updateShop,
    loadDemoData,
  };
}
