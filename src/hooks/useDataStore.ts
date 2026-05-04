import { useState, useCallback, useEffect, useRef } from 'react';
import { Client, Consultation, Designer, Booking, Shop } from '../types';
import { mockClients, mockConsultations, mockDesigners, mockBookings, mockShops } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';
import { toast } from './useToast';
import { getStorageUsage } from '../utils/backup';

// ── 저장소 경고 ──────────────────────────────────────────────────
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
    toast.warning(
      `저장 공간이 ${Math.round(percent)}% 사용되었습니다. 데이터 백업을 권장합니다.`,
      6000,
    );
  } catch {}
}

// ── localStorage 로드 ────────────────────────────────────────────
export const STORAGE_KEY = 'hairlog_data';
export const DATA_VERSION = 4;

const MOCK_DEFAULTS = () => ({
  clients:       mockClients,
  consultations: mockConsultations,
  designers:     mockDesigners,
  bookings:      mockBookings,
  shops:         mockShops,
});

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p.version !== DATA_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        return MOCK_DEFAULTS();
      }
      return {
        clients:       p.clients       ?? mockClients,
        consultations: p.consultations ?? mockConsultations,
        designers:     p.designers     ?? mockDesigners,
        bookings:      p.bookings      ?? mockBookings,
        shops:         p.shops         ?? mockShops,
      };
    }
  } catch {}
  return MOCK_DEFAULTS();
}

// 최초 1회만 파싱
const initialData = loadFromStorage();

/** 데이터 CRUD + localStorage 자동 저장을 담당하는 훅 */
export function useDataStore() {
  const [clients,       setClients]       = useState<Client[]>      (initialData.clients);
  const [consultations, setConsultations] = useState<Consultation[]>(initialData.consultations);
  const [designers,     setDesigners]     = useState<Designer[]>    (initialData.designers);
  const [bookings,      setBookings]      = useState<Booking[]>     (initialData.bookings);
  const [shops,         setShops]         = useState<Shop[]>        (initialData.shops);

  // 300ms 디바운스 자동 저장
  const isMounted = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: DATA_VERSION,
        clients, consultations, designers, bookings, shops,
      }));
      checkStorageAndWarn();
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [clients, consultations, designers, bookings, shops]);

  // ── Clients ─────────────────────────────────────────────────────
  const addClient = useCallback((data: Omit<Client, 'id' | 'createdAt'>) => {
    const client: Client = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    setClients(prev => [...prev, client]);
    toast.success(`${client.name} 고객이 등록되었습니다.`);
    return client;
  }, []);

  const updateClient = useCallback((id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => {
      const target = prev.find(c => c.id === id);
      if (target) toast.info(`${target.name} 고객 정보가 삭제되었습니다.`);
      return prev.filter(c => c.id !== id);
    });
    setConsultations(prev => prev.filter(c => c.clientId !== id));
    setBookings(prev => prev.filter(b => b.clientId !== id));
  }, []);

  // ── Consultations ────────────────────────────────────────────────
  const addConsultation = useCallback((data: Omit<Consultation, 'id' | 'shareToken' | 'createdAt'>) => {
    const consultation: Consultation = {
      ...data, id: uuidv4(),
      shareToken: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setConsultations(prev => [...prev, consultation]);
    toast.success('상담이 저장되었습니다.');
    return consultation;
  }, []);

  const updateConsultation = useCallback((id: string, data: Partial<Consultation>) => {
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    const keys = Object.keys(data);
    const isSilent = keys.length === 1 && (keys[0] === 'modificationRequest' || keys[0] === 'isShared');
    if (!isSilent) toast.success('상담이 수정되었습니다.');
  }, []);

  const deleteConsultation = useCallback((id: string) => {
    setConsultations(prev => prev.filter(c => c.id !== id));
    toast.info('상담이 삭제되었습니다.');
  }, []);

  const toggleShare = useCallback((id: string) => {
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, isShared: !c.isShared } : c));
  }, []);

  // ── Designers ────────────────────────────────────────────────────
  const addDesigner = useCallback((data: Omit<Designer, 'id'>) => {
    const designer: Designer = { ...data, id: uuidv4() };
    setDesigners(prev => [...prev, designer]);
    return designer;
  }, []);

  const updateDesigner = useCallback((id: string, data: Partial<Designer>) => {
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

  // ── Bookings ─────────────────────────────────────────────────────
  const addBooking = useCallback((data: Omit<Booking, 'id' | 'createdAt'>) => {
    const booking: Booking = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    setBookings(prev => [...prev, booking]);
    toast.success('예약이 신청되었습니다. 확정 후 알려드립니다.');
    return booking;
  }, []);

  const updateBooking = useCallback((id: string, data: Partial<Booking>) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
    if (data.status === 'confirmed') toast.success('예약이 확정되었습니다.');
    else if (data.status === 'cancelled') toast.info('예약이 취소되었습니다.');
  }, []);

  // ── Shops ─────────────────────────────────────────────────────────
  const addShop = useCallback((data: Omit<Shop, 'id' | 'createdAt'>) => {
    const shop: Shop = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    setShops(prev => [...prev, shop]);
    return shop;
  }, []);

  const updateShop = useCallback((id: string, data: Partial<Shop>) => {
    setShops(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    toast.success('지점 정보가 저장되었습니다.');
  }, []);

  return {
    clients, consultations, designers, bookings, shops,
    addClient, updateClient, deleteClient,
    addConsultation, updateConsultation, deleteConsultation, toggleShare,
    addDesigner, updateDesigner,
    addBooking, updateBooking,
    addShop, updateShop,
  };
}
