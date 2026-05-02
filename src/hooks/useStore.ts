import { useState, useCallback } from 'react';
import { Client, Consultation, Designer, Booking, Shop, View, AppState } from '../types';
import { mockClients, mockConsultations, mockDesigners, mockBookings, mockShops } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'hairlog_data';
// 버전을 올리면 구버전 localStorage를 자동으로 초기화합니다.
// shopId 추가(v2), designerId + 오컬러 계정(v3) 등 스키마 변경 시 반드시 올릴 것.
const DATA_VERSION = 3;

const MOCK_DEFAULTS = () => ({
  clients: mockClients, consultations: mockConsultations,
  designers: mockDesigners, bookings: mockBookings, shops: mockShops,
});

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      // 버전 불일치 → 구버전 데이터 파기, 새 mockData 사용
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

function save(
  clients: Client[], consultations: Consultation[],
  designers: Designer[], bookings: Booking[], shops: Shop[],
) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: DATA_VERSION,
    clients, consultations, designers, bookings, shops,
  }));
}

export function useStore() {
  const [clients,       setClients]       = useState<Client[]>      (() => loadFromStorage().clients);
  const [consultations, setConsultations] = useState<Consultation[]>(() => loadFromStorage().consultations);
  const [designers,     setDesigners]     = useState<Designer[]>    (() => loadFromStorage().designers);
  const [bookings,      setBookings]      = useState<Booking[]>     (() => loadFromStorage().bookings);
  const [shops,         setShops]         = useState<Shop[]>        (() => loadFromStorage().shops);

  const [state, setState] = useState<Omit<AppState, 'clients' | 'consultations' | 'shops'>>({
    currentView: 'dashboard',
    selectedClientId: null,
    selectedConsultationId: null,
    shareToken: null,
  });

  const navigate = useCallback((view: View, clientId?: string, consultationId?: string, token?: string) => {
    setState(s => ({
      ...s,
      currentView: view,
      selectedClientId:      clientId      ?? s.selectedClientId,
      selectedConsultationId: consultationId ?? null,
      shareToken: token ?? null,
    }));
  }, []);

  // ── Clients ──────────────────────────────────────────────────
  const addClient = useCallback((data: Omit<Client, 'id' | 'createdAt'>) => {
    const client: Client = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    setClients(prev => {
      const next = [...prev, client];
      setConsultations(cons => { setDesigners(des => { setBookings(bks => { setShops(shs => { save(next, cons, des, bks, shs); return shs; }); return bks; }); return des; }); return cons; });
      return next;
    });
    return client;
  }, []);

  const updateClient = useCallback((id: string, data: Partial<Client>) => {
    setClients(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...data } : c);
      setConsultations(cons => { setDesigners(des => { setBookings(bks => { setShops(shs => { save(next, cons, des, bks, shs); return shs; }); return bks; }); return des; }); return cons; });
      return next;
    });
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => {
      const next = prev.filter(c => c.id !== id);
      setConsultations(cons => {
        const nextCons = cons.filter(c => c.clientId !== id);
        setDesigners(des => { setBookings(bks => { setShops(shs => { save(next, nextCons, des, bks, shs); return shs; }); return bks; }); return des; });
        return nextCons;
      });
      return next;
    });
  }, []);

  // ── Consultations ─────────────────────────────────────────────
  const addConsultation = useCallback((data: Omit<Consultation, 'id' | 'shareToken' | 'createdAt'>) => {
    const consultation: Consultation = {
      ...data, id: uuidv4(),
      shareToken: `share-${uuidv4().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    setConsultations(prev => {
      const next = [...prev, consultation];
      setClients(cls => { setDesigners(des => { setBookings(bks => { setShops(shs => { save(cls, next, des, bks, shs); return shs; }); return bks; }); return des; }); return cls; });
      return next;
    });
    return consultation;
  }, []);

  const updateConsultation = useCallback((id: string, data: Partial<Consultation>) => {
    setConsultations(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...data } : c);
      setClients(cls => { setDesigners(des => { setBookings(bks => { setShops(shs => { save(cls, next, des, bks, shs); return shs; }); return bks; }); return des; }); return cls; });
      return next;
    });
  }, []);

  const deleteConsultation = useCallback((id: string) => {
    setConsultations(prev => {
      const next = prev.filter(c => c.id !== id);
      setClients(cls => { setDesigners(des => { setBookings(bks => { setShops(shs => { save(cls, next, des, bks, shs); return shs; }); return bks; }); return des; }); return cls; });
      return next;
    });
  }, []);

  const toggleShare = useCallback((id: string) => {
    setConsultations(prev => {
      const next = prev.map(c => c.id === id ? { ...c, isShared: !c.isShared } : c);
      setClients(cls => { setDesigners(des => { setBookings(bks => { setShops(shs => { save(cls, next, des, bks, shs); return shs; }); return bks; }); return des; }); return cls; });
      return next;
    });
  }, []);

  // ── Designers ─────────────────────────────────────────────────
  const addDesigner = useCallback((data: Omit<Designer, 'id'>) => {
    const designer: Designer = { ...data, id: uuidv4() };
    setDesigners(prev => {
      const next = [...prev, designer];
      setClients(cls => { setConsultations(cons => { setBookings(bks => { setShops(shs => { save(cls, cons, next, bks, shs); return shs; }); return bks; }); return cons; }); return cls; });
      return next;
    });
    return designer;
  }, []);

  const updateDesigner = useCallback((id: string, data: Partial<Designer>) => {
    setDesigners(prev => {
      const next = prev.map(d => d.id === id ? { ...d, ...data } : d);
      setClients(cls => { setConsultations(cons => { setBookings(bks => { setShops(shs => { save(cls, cons, next, bks, shs); return shs; }); return bks; }); return cons; }); return cls; });
      return next;
    });
  }, []);

  // ── Bookings ──────────────────────────────────────────────────
  const addBooking = useCallback((data: Omit<Booking, 'id' | 'createdAt'>) => {
    const booking: Booking = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    setBookings(prev => {
      const next = [...prev, booking];
      setClients(cls => { setConsultations(cons => { setDesigners(des => { setShops(shs => { save(cls, cons, des, next, shs); return shs; }); return des; }); return cons; }); return cls; });
      return next;
    });
    return booking;
  }, []);

  const updateBooking = useCallback((id: string, data: Partial<Booking>) => {
    setBookings(prev => {
      const next = prev.map(b => b.id === id ? { ...b, ...data } : b);
      setClients(cls => { setConsultations(cons => { setDesigners(des => { setShops(shs => { save(cls, cons, des, next, shs); return shs; }); return des; }); return cons; }); return cls; });
      return next;
    });
  }, []);

  // ── Shops ─────────────────────────────────────────────────────
  const updateShop = useCallback((id: string, data: Partial<Shop>) => {
    setShops(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...data } : s);
      setClients(cls => { setConsultations(cons => { setDesigners(des => { setBookings(bks => { save(cls, cons, des, bks, next); return bks; }); return des; }); return cons; }); return cls; });
      return next;
    });
  }, []);

  return {
    clients, consultations, designers, bookings, shops,
    ...state,
    navigate,
    addClient, updateClient, deleteClient,
    addConsultation, updateConsultation, deleteConsultation, toggleShare,
    addDesigner, updateDesigner,
    addBooking, updateBooking,
    updateShop,
  };
}
