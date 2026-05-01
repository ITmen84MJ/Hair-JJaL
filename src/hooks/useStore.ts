import { useState, useCallback } from 'react';
import { Client, Consultation, Designer, Booking, View, AppState } from '../types';
import { mockClients, mockConsultations, mockDesigners, mockBookings } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'hairlog_data';

function loadFromStorage(): {
  clients: Client[];
  consultations: Consultation[];
  designers: Designer[];
  bookings: Booking[];
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        clients: p.clients ?? mockClients,
        consultations: p.consultations ?? mockConsultations,
        designers: p.designers ?? mockDesigners,
        bookings: p.bookings ?? mockBookings,
      };
    }
  } catch {}
  return { clients: mockClients, consultations: mockConsultations, designers: mockDesigners, bookings: mockBookings };
}

function save(clients: Client[], consultations: Consultation[], designers: Designer[], bookings: Booking[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ clients, consultations, designers, bookings }));
}

export function useStore() {
  const initial = loadFromStorage();
  const [clients, setClients] = useState<Client[]>(initial.clients);
  const [consultations, setConsultations] = useState<Consultation[]>(initial.consultations);
  const [designers, setDesigners] = useState<Designer[]>(initial.designers);
  const [bookings, setBookings] = useState<Booking[]>(initial.bookings);
  const [state, setState] = useState<Omit<AppState, 'clients' | 'consultations'>>({
    currentView: 'dashboard',
    selectedClientId: null,
    selectedConsultationId: null,
    shareToken: null,
  });

  const navigate = useCallback((view: View, clientId?: string, consultationId?: string, token?: string) => {
    setState(s => ({
      ...s,
      currentView: view,
      selectedClientId: clientId ?? s.selectedClientId,
      selectedConsultationId: consultationId ?? null,
      shareToken: token ?? null,
    }));
  }, []);

  // ── Clients ──
  const addClient = useCallback((data: Omit<Client, 'id' | 'createdAt'>) => {
    const client: Client = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    setClients(prev => { const next = [...prev, client]; save(next, consultations, designers, bookings); return next; });
    return client;
  }, [consultations, designers, bookings]);

  const updateClient = useCallback((id: string, data: Partial<Client>) => {
    setClients(prev => { const next = prev.map(c => c.id === id ? { ...c, ...data } : c); save(next, consultations, designers, bookings); return next; });
  }, [consultations, designers, bookings]);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => {
      const next = prev.filter(c => c.id !== id);
      const nextCons = consultations.filter(c => c.clientId !== id);
      save(next, nextCons, designers, bookings);
      setConsultations(nextCons);
      return next;
    });
  }, [consultations, designers, bookings]);

  // ── Consultations ──
  const addConsultation = useCallback((data: Omit<Consultation, 'id' | 'shareToken' | 'createdAt'>) => {
    const consultation: Consultation = {
      ...data, id: uuidv4(),
      shareToken: `share-${uuidv4().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    setConsultations(prev => { const next = [...prev, consultation]; save(clients, next, designers, bookings); return next; });
    return consultation;
  }, [clients, designers, bookings]);

  const updateConsultation = useCallback((id: string, data: Partial<Consultation>) => {
    setConsultations(prev => { const next = prev.map(c => c.id === id ? { ...c, ...data } : c); save(clients, next, designers, bookings); return next; });
  }, [clients, designers, bookings]);

  const deleteConsultation = useCallback((id: string) => {
    setConsultations(prev => { const next = prev.filter(c => c.id !== id); save(clients, next, designers, bookings); return next; });
  }, [clients, designers, bookings]);

  const toggleShare = useCallback((id: string) => {
    setConsultations(prev => { const next = prev.map(c => c.id === id ? { ...c, isShared: !c.isShared } : c); save(clients, next, designers, bookings); return next; });
  }, [clients, designers, bookings]);

  // ── Designers ──
  const addDesigner = useCallback((data: Omit<Designer, 'id'>) => {
    const designer: Designer = { ...data, id: uuidv4() };
    setDesigners(prev => { const next = [...prev, designer]; save(clients, consultations, next, bookings); return next; });
    return designer;
  }, [clients, consultations, bookings]);

  const updateDesigner = useCallback((id: string, data: Partial<Designer>) => {
    setDesigners(prev => { const next = prev.map(d => d.id === id ? { ...d, ...data } : d); save(clients, consultations, next, bookings); return next; });
  }, [clients, consultations, bookings]);

  // ── Bookings ──
  const addBooking = useCallback((data: Omit<Booking, 'id' | 'createdAt'>) => {
    const booking: Booking = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    setBookings(prev => { const next = [...prev, booking]; save(clients, consultations, designers, next); return next; });
    return booking;
  }, [clients, consultations, designers]);

  const updateBooking = useCallback((id: string, data: Partial<Booking>) => {
    setBookings(prev => { const next = prev.map(b => b.id === id ? { ...b, ...data } : b); save(clients, consultations, designers, next); return next; });
  }, [clients, consultations, designers]);

  return {
    clients, consultations, designers, bookings,
    ...state,
    navigate,
    addClient, updateClient, deleteClient,
    addConsultation, updateConsultation, deleteConsultation, toggleShare,
    addDesigner, updateDesigner,
    addBooking, updateBooking,
  };
}
