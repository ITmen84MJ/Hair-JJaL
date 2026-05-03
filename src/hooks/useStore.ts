import { useState, useCallback, useEffect, useRef } from 'react';
import { Client, Consultation, Designer, Booking, Shop, View, AppState } from '../types';
import { mockClients, mockConsultations, mockDesigners, mockBookings, mockShops } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'hairlog_data';
// 스키마 변경 시 반드시 올릴 것 — 구버전 localStorage를 자동 초기화
// v2: shopId 추가 / v3: designerId + 오컬러 계정
// v4: Client.shopId optional / Consultation.modificationRequest / 크로스-지점 모델
const DATA_VERSION = 4;

const MOCK_DEFAULTS = () => ({
  clients: mockClients,
  consultations: mockConsultations,
  designers: mockDesigners,
  bookings: mockBookings,
  shops: mockShops,
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

// 최초 1회만 파싱 — 각 useState 초기화에서 5번 호출하던 문제 해결
const initialData = loadFromStorage();

export function useStore() {
  const [clients,       setClients]       = useState<Client[]>      (initialData.clients);
  const [consultations, setConsultations] = useState<Consultation[]>(initialData.consultations);
  const [designers,     setDesigners]     = useState<Designer[]>    (initialData.designers);
  const [bookings,      setBookings]      = useState<Booking[]>     (initialData.bookings);
  const [shops,         setShops]         = useState<Shop[]>        (initialData.shops);

  const [state, setState] = useState<Omit<AppState, 'clients' | 'consultations' | 'shops'>>({
    currentView: 'dashboard',
    selectedClientId: null,
    selectedConsultationId: null,
    shareToken: null,
  });

  // ── 자동 저장: 상태 변경 시마다 useEffect에서 localStorage 기록
  // 중첩 setState 안에서 save()를 호출하던 불안정한 패턴을 완전히 교체
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      // 초기 마운트에서는 저장하지 않음 (이미 로드된 데이터를 덮어쓰지 않도록)
      isMounted.current = true;
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: DATA_VERSION,
      clients, consultations, designers, bookings, shops,
    }));
  }, [clients, consultations, designers, bookings, shops]);

  const navigate = useCallback((view: View, clientId?: string, consultationId?: string, token?: string) => {
    setState(s => ({
      ...s,
      currentView: view,
      selectedClientId:      clientId      ?? s.selectedClientId,
      selectedConsultationId: consultationId ?? null,
      shareToken: token ?? null,
    }));
  }, []);

  // ── Clients ────────────────────────────────────────────────────
  const addClient = useCallback((data: Omit<Client, 'id' | 'createdAt'>) => {
    const client: Client = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    setClients(prev => [...prev, client]);
    return client;
  }, []);

  const updateClient = useCallback((id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    setConsultations(prev => prev.filter(c => c.clientId !== id));
    setBookings(prev => prev.filter(b => b.clientId !== id));
  }, []);

  // ── Consultations ──────────────────────────────────────────────
  const addConsultation = useCallback((data: Omit<Consultation, 'id' | 'shareToken' | 'createdAt'>) => {
    const consultation: Consultation = {
      ...data, id: uuidv4(),
      shareToken: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setConsultations(prev => [...prev, consultation]);
    return consultation;
  }, []);

  const updateConsultation = useCallback((id: string, data: Partial<Consultation>) => {
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteConsultation = useCallback((id: string) => {
    setConsultations(prev => prev.filter(c => c.id !== id));
  }, []);

  const toggleShare = useCallback((id: string) => {
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, isShared: !c.isShared } : c));
  }, []);

  // ── Designers ──────────────────────────────────────────────────
  const addDesigner = useCallback((data: Omit<Designer, 'id'>) => {
    const designer: Designer = { ...data, id: uuidv4() };
    setDesigners(prev => [...prev, designer]);
    return designer;
  }, []);

  const updateDesigner = useCallback((id: string, data: Partial<Designer>) => {
    // P2-20: 이름이 바뀌면 해당 디자이너의 상담 이력 stylistName 동기화
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
  }, []);

  // ── Bookings ───────────────────────────────────────────────────
  const addBooking = useCallback((data: Omit<Booking, 'id' | 'createdAt'>) => {
    const booking: Booking = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    setBookings(prev => [...prev, booking]);
    return booking;
  }, []);

  const updateBooking = useCallback((id: string, data: Partial<Booking>) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  }, []);

  // ── Shops ──────────────────────────────────────────────────────
  const addShop = useCallback((data: Omit<Shop, 'id' | 'createdAt'>) => {
    const shop: Shop = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    setShops(prev => [...prev, shop]);
    return shop;
  }, []);

  const updateShop = useCallback((id: string, data: Partial<Shop>) => {
    setShops(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }, []);

  return {
    clients, consultations, designers, bookings, shops,
    ...state,
    navigate,
    addClient, updateClient, deleteClient,
    addConsultation, updateConsultation, deleteConsultation, toggleShare,
    addDesigner, updateDesigner,
    addBooking, updateBooking,
    addShop, updateShop,
  };
}
