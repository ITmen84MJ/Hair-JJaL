/**
 * useSupabaseStore — Supabase 기반 CRUD + Realtime (B2 + B4)
 * useLocalStore 와 완전히 동일한 async 인터페이스를 유지한다.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Client, Consultation, Designer, Booking, Shop, Service } from '../types';
import { supabase } from '../lib/supabase';
import { toCamel, toSnake, toDateStr } from '../lib/caseConvert';
import { toast } from './useToast';
import type { ClientRow, ConsultationRow, DesignerRow, BookingRow, ShopRow } from '../lib/database.types';

/**
 * Supabase 클라이언트의 from().insert/update/upsert() 는 Database 제네릭 기반으로
 * 타입을 강제하기 때문에 camelCase→snake_case 변환된 Record<string, unknown> 을 넘기면
 * 'never' 추론이 발생한다.
 * 경계 레이어(hook 내부)에서만 from() 전체를 any 로 우회하여 외부 인터페이스 타입 안전성을 유지.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = (table: string): any => supabase.from(table as any);

// ── Row → 앱 타입 변환 ─────────────────────────────────────────────────────

function rowToClient(row: ClientRow): Client {
  return toCamel<Client>(row as unknown as Record<string, unknown>);
}

function rowToConsultation(row: ConsultationRow): Consultation {
  const base = toCamel<Record<string, unknown>>(row as unknown as Record<string, unknown>);
  return {
    ...base,
    services:            (row.services ?? []) as unknown as Service[],
    modificationRequest: (row.modification_request ?? undefined) as Consultation['modificationRequest'],
    shopId:              row.shop_id ?? '',
    clientId:            row.client_id ?? '',
    shareToken:          row.share_token,
    isShared:            row.is_shared,
    hairCondition:       row.hair_condition ?? '',
    notes:               row.notes ?? '',
    createdAt:           row.created_at,
  } as Consultation;
}

function rowToDesigner(row: DesignerRow): Designer {
  const base = toCamel<Record<string, unknown>>(row as unknown as Record<string, unknown>);
  return {
    ...base,
    shopId:   row.shop_id ?? '',
    joinedAt: row.joined_at ?? new Date().toISOString().slice(0, 10),
    status:   (row.status ?? 'active') as Designer['status'],
    role:     (row.role ?? 'staff') as Designer['role'],
  } as Designer;
}

function rowToBooking(row: BookingRow): Booking {
  return toCamel<Booking>(row as unknown as Record<string, unknown>);
}

function rowToShop(row: ShopRow): Shop {
  return toCamel<Shop>(row as unknown as Record<string, unknown>);
}

// ─────────────────────────────────────────────────────────────────────────────

export function useSupabaseStore() {
  const [clients,       setClients]       = useState<Client[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [designers,     setDesigners]     = useState<Designer[]>([]);
  const [bookings,      setBookings]      = useState<Booking[]>([]);
  const [shops,         setShops]         = useState<Shop[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);

  const shopIdRef = useRef<string | null>(null);

  // ── 초기 데이터 로드 ────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [shopsRes, designersRes, clientsRes, consultationsRes, bookingsRes] =
        await Promise.all([
          db('shops').select('*'),
          db('designers').select('*').eq('status', 'active'),
          db('clients').select('*'),
          db('consultations').select('*').order('date', { ascending: false }),
          db('bookings').select('*').order('created_at', { ascending: false }),
        ]);

      if (shopsRes.data)         setShops(shopsRes.data.map(rowToShop));
      if (designersRes.data)     setDesigners(designersRes.data.map(rowToDesigner));
      if (clientsRes.data)       setClients(clientsRes.data.map(rowToClient));
      if (consultationsRes.data) setConsultations(consultationsRes.data.map(rowToConsultation));
      if (bookingsRes.data)      setBookings(bookingsRes.data.map(rowToBooking));

      if (shopsRes.data?.[0]) shopIdRef.current = shopsRes.data[0].id;
    } catch (e) {
      console.error('[useSupabaseStore] 로드 실패:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── 로그인/로그아웃 시 데이터 재로드 ─────────────────────────────────────
  // useStore는 !user 분기 전에 호출되므로 로그인 전(익명) 에 loadAll이 먼저 실행됨.
  // Auth 상태가 바뀌면(SIGNED_IN) RLS가 활성화되므로 데이터를 다시 불러와야 한다.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadAll();
      } else if (event === 'SIGNED_OUT') {
        setShops([]);
        setDesigners([]);
        setClients([]);
        setConsultations([]);
        setBookings([]);
      }
    });
    return () => subscription.unsubscribe();
  }, [loadAll]);

  // ── B4 Realtime 구독 ─────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('hairjjal_store')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' },
        () => db('clients').select('*')
          .then((r: {data: import('../lib/database.types').ClientRow[] | null}) => r.data && setClients(r.data.map(rowToClient))))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consultations' },
        () => db('consultations').select('*').order('date', { ascending: false })
          .then((r: {data: import('../lib/database.types').ConsultationRow[] | null}) => r.data && setConsultations(r.data.map(rowToConsultation))))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'designers' },
        () => db('designers').select('*').eq('status', 'active')
          .then((r: {data: import('../lib/database.types').DesignerRow[] | null}) => r.data && setDesigners(r.data.map(rowToDesigner))))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' },
        () => db('bookings').select('*').order('created_at', { ascending: false })
          .then((r: {data: import('../lib/database.types').BookingRow[] | null}) => r.data && setBookings(r.data.map(rowToBooking))))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Clients ───────────────────────────────────────────────────────────────

  const addClient = useCallback(async (data: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    const insert = toSnake({ ...data });
    const { data: row, error } = await db('clients').insert(insert).select().single();
    if (error || !row) { toast.error('고객 등록에 실패했습니다.'); throw error; }
    const client = rowToClient(row as ClientRow);
    setClients(prev => [...prev, client]);
    toast.success(`${client.name} 고객이 등록되었습니다.`);
    return client;
  }, []);

  const updateClient = useCallback(async (id: string, data: Partial<Client>): Promise<void> => {
    const update = toSnake(data);
    const { error } = await db('clients').update(update).eq('id', id);
    if (error) { toast.error('저장에 실패했습니다.'); return; }
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteClient = useCallback(async (id: string): Promise<void> => {
    const target = clients.find(c => c.id === id);
    const { error } = await db('clients').delete().eq('id', id);
    if (error) { toast.error('삭제에 실패했습니다.'); return; }
    if (target) toast.info(`${target.name} 고객 정보가 삭제되었습니다.`);
    setClients(prev => prev.filter(c => c.id !== id));
    setConsultations(prev => prev.filter(c => c.clientId !== id));
    setBookings(prev => prev.filter(b => b.clientId !== id));
  }, [clients]);

  // ── Consultations ─────────────────────────────────────────────────────────

  const addConsultation = useCallback(async (
    data: Omit<Consultation, 'id' | 'shareToken' | 'createdAt'>,
  ): Promise<Consultation> => {
    const insert = {
      ...toSnake({ ...data }),
      next_visit_date: toDateStr(data.nextVisitDate),
      services: data.services,                            // JSONB: camelCase 그대로
      modification_request: data.modificationRequest ?? null,
    };
    const { data: row, error } = await db('consultations').insert(insert).select().single();
    if (error || !row) { toast.error('상담 저장에 실패했습니다.'); throw error; }
    const consultation = rowToConsultation(row as ConsultationRow);
    setConsultations(prev => [consultation, ...prev]);
    toast.success('상담이 저장되었습니다.');
    return consultation;
  }, []);

  const updateConsultation = useCallback(async (id: string, data: Partial<Consultation>): Promise<void> => {
    const update = {
      ...toSnake({ ...data }),
      ...(data.services ? { services: data.services } : {}),
      ...(data.modificationRequest !== undefined ? { modification_request: data.modificationRequest } : {}),
    };
    const { error } = await db('consultations').update(update).eq('id', id);
    if (error) { toast.error('저장에 실패했습니다.'); return; }
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    const keys = Object.keys(data);
    const isSilent = keys.length === 1 && (keys[0] === 'modificationRequest' || keys[0] === 'isShared');
    if (!isSilent) toast.success('상담이 수정되었습니다.');
  }, []);

  const deleteConsultation = useCallback(async (id: string): Promise<void> => {
    const { error } = await db('consultations').delete().eq('id', id);
    if (error) { toast.error('삭제에 실패했습니다.'); return; }
    setConsultations(prev => prev.filter(c => c.id !== id));
    toast.info('상담이 삭제되었습니다.');
  }, []);

  const toggleShare = useCallback(async (id: string): Promise<void> => {
    const target = consultations.find(c => c.id === id);
    if (!target) return;
    const newVal = !target.isShared;
    const update = { is_shared: newVal };
    await db('consultations').update(update).eq('id', id);
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, isShared: newVal } : c));
  }, [consultations]);

  // ── Designers ─────────────────────────────────────────────────────────────

  const addDesigner = useCallback(async (data: Omit<Designer, 'id'>): Promise<Designer> => {
    const insert = toSnake({ ...data });
    const { data: row, error } = await db('designers').insert(insert).select().single();
    if (error || !row) { toast.error('디자이너 등록에 실패했습니다.'); throw error; }
    const designer = rowToDesigner(row as DesignerRow);
    setDesigners(prev => [...prev, designer]);
    return designer;
  }, []);

  const updateDesigner = useCallback(async (id: string, data: Partial<Designer>): Promise<void> => {
    if (data.name !== undefined) {
      const oldName = designers.find(d => d.id === id)?.name;
      if (oldName && oldName !== data.name) {
        const nameUpdate = { stylist_name: data.name };
        await db('consultations').update(nameUpdate).eq('stylist_name', oldName);
        setConsultations(prev => prev.map(c =>
          c.stylistName === oldName ? { ...c, stylistName: data.name as string } : c
        ));
      }
    }
    const update = toSnake({ ...data });
    const { error } = await db('designers').update(update).eq('id', id);
    if (error) { toast.error('저장에 실패했습니다.'); return; }
    setDesigners(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    if (data.status === 'inactive') toast.info('퇴직 처리되었습니다.');
    else if (data.status === 'active' && !Object.keys(data).some(k => !['status', 'leftAt', 'leftReason'].includes(k))) toast.success('재활성화되었습니다.');
    else toast.success('디자이너 정보가 저장되었습니다.');
  }, [designers]);

  // ── Bookings ──────────────────────────────────────────────────────────────

  const addBooking = useCallback(async (data: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> => {
    const insert = toSnake({ ...data });
    const { data: row, error } = await db('bookings').insert(insert).select().single();
    if (error || !row) { toast.error('예약 신청에 실패했습니다.'); throw error; }
    const booking = rowToBooking(row as BookingRow);
    setBookings(prev => [booking, ...prev]);
    toast.success('예약이 신청되었습니다. 확정 후 알려드립니다.');
    return booking;
  }, []);

  const updateBooking = useCallback(async (id: string, data: Partial<Booking>): Promise<void> => {
    const update = toSnake({ ...data });
    const { error } = await db('bookings').update(update).eq('id', id);
    if (error) { toast.error('저장에 실패했습니다.'); return; }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
    if (data.status === 'confirmed') toast.success('예약이 확정되었습니다.');
    else if (data.status === 'cancelled') toast.info('예약이 취소되었습니다.');
  }, []);

  // ── Shops ─────────────────────────────────────────────────────────────────

  const addShop = useCallback(async (data: Omit<Shop, 'id' | 'createdAt'>): Promise<Shop> => {
    const insert = toSnake({ ...data });
    const { data: row, error } = await db('shops').insert(insert).select().single();
    if (error || !row) { toast.error('지점 생성에 실패했습니다.'); throw error; }
    const shop = rowToShop(row as ShopRow);
    setShops(prev => [...prev, shop]);
    shopIdRef.current = shop.id;
    return shop;
  }, []);

  const updateShop = useCallback(async (id: string, data: Partial<Shop>): Promise<void> => {
    const update = toSnake({ ...data });
    const { error } = await db('shops').update(update).eq('id', id);
    if (error) { toast.error('저장에 실패했습니다.'); return; }
    setShops(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    toast.success('지점 정보가 저장되었습니다.');
  }, []);

  return {
    clients, consultations, designers, bookings, shops,
    isLoading,
    addClient, updateClient, deleteClient,
    addConsultation, updateConsultation, deleteConsultation, toggleShare,
    addDesigner, updateDesigner,
    addBooking, updateBooking,
    addShop, updateShop,
  };
}
