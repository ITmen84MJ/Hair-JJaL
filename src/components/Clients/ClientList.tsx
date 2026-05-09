import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Plus, Phone, ChevronRight, Trash2, AlertTriangle, ArrowUpDown, Filter, UserSearch, UserPlus } from 'lucide-react';
import { Client, Consultation, ServiceType } from '../../types';
import { ClientForm } from './ClientForm';
import { Modal } from '../common/Modal';
import { format, parseISO } from 'date-fns';
import { SERVICE_LABELS } from '../Consultations/serviceLabels';
import { USE_SUPABASE, supabase } from '../../lib/supabase';

const ALL_SERVICE_TYPES: ServiceType[] = ['cut', 'color', 'bleach', 'perm', 'straightening', 'treatment', 'scalp', 'styling', 'other'];

interface CustomerSearchResult {
  auth_user_id: string;
  email: string;
  display_name: string;
}

interface Props {
  clients: Client[];
  consultations: Consultation[];
  onSelectClient: (id: string) => void;
  onAddClient: (data: Omit<Client, 'id' | 'createdAt' | 'shopId'>) => void;
  onLinkClient?: (authUserId: string, data: Omit<Client, 'id' | 'createdAt' | 'shopId'>) => Promise<void>;
  onDeleteClient: (id: string) => void;
  shopId?: string;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

function DeleteClientModal({ client, visitCount, onClose, onConfirm }: {
  client: Client;
  visitCount: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--bg-danger)' }}>
            <AlertTriangle size={18} style={{ color: 'var(--text-danger)' }} />
          </div>
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>고객 삭제</h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{client.name}</span> 고객을 삭제할까요?
        </p>
        {visitCount > 0 && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: 'var(--bg-danger)', color: 'var(--text-danger)' }}>
            상담 이력 {visitCount}건 및 관련 예약이 모두 함께 삭제됩니다.
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>취소</button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold">삭제</button>
        </div>
      </div>
    </Modal>
  );
}

// ── AddClientModal ────────────────────────────────────────────────────────────
function AddClientModal({ shopId, onClose, onAdd, onLink }: {
  shopId?: string;
  onClose: () => void;
  onAdd:  (data: Omit<Client, 'id' | 'createdAt' | 'shopId'>) => void;
  onLink?: (authUserId: string, data: Omit<Client, 'id' | 'createdAt' | 'shopId'>) => Promise<void>;
}) {
  const [tab, setTab] = useState<'search' | 'new'>(USE_SUPABASE && onLink ? 'search' : 'new');
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<CustomerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<CustomerSearchResult | null>(null);
  const [linking, setLinking]   = useState(false);
  const [linkDone, setLinkDone] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 검색 디바운스
  useEffect(() => {
    if (!USE_SUPABASE || tab !== 'search') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 1) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).rpc('search_customer_accounts', {
        p_shop_id: shopId,
        search_query: query.trim(),
      });
      setResults((data as CustomerSearchResult[] | null) ?? []);
      setSearching(false);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, tab, shopId]);

  const handleLink = async () => {
    if (!selected || !onLink) return;
    setLinking(true);
    await onLink(selected.auth_user_id, {
      name: selected.display_name,
      phone: '',
      email: selected.email,
      gender: 'female',
      authUserId: selected.auth_user_id,
    });
    setLinking(false);
    setLinkDone(true);
  };

  const inp = "w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300";
  const inpStyle = { borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' };
  const card2 = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>고객 추가</h2>
      </div>

      {/* 탭 — Supabase + onLink 있을 때만 표시 */}
      {USE_SUPABASE && onLink && (
        <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
          {([['search', '기존 계정 연결', UserSearch], ['new', '새 고객 추가', UserPlus]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === id ? 'border-rose-500' : 'border-transparent'}`}
              style={{ color: tab === id ? '#f43f5e' : 'var(--text-muted)' }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      )}

      <div className="p-5">
        {tab === 'search' ? (
          linkDone ? (
            <div className="text-center py-8 space-y-2">
              <div className="text-3xl">✅</div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>연결 완료!</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selected?.display_name} 고객이 추가되었습니다.</p>
              <button onClick={onClose} className="mt-3 px-5 py-2 bg-rose-500 text-white rounded-xl text-sm font-semibold">닫기</button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>앱에 가입된 고객 계정을 이름 또는 이메일로 검색합니다.</p>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  value={query} onChange={e => { setQuery(e.target.value); setSelected(null); }}
                  placeholder="이름 또는 이메일 검색"
                  className={`${inp} pl-9`} style={inpStyle} autoFocus />
              </div>
              {searching && <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>검색 중…</p>}
              {!searching && results.length === 0 && query.trim().length > 0 && (
                <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>검색 결과가 없습니다.</p>
              )}
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {results.map(r => (
                  <button key={r.auth_user_id} onClick={() => setSelected(r)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${selected?.auth_user_id === r.auth_user_id ? 'bg-rose-500 border-rose-500' : ''}`}
                    style={selected?.auth_user_id !== r.auth_user_id ? card2 : {}}>
                    <p className={`text-sm font-semibold ${selected?.auth_user_id === r.auth_user_id ? 'text-white' : ''}`}
                      style={selected?.auth_user_id !== r.auth_user_id ? { color: 'var(--text-primary)' } : {}}>
                      {r.display_name}
                    </p>
                    <p className={`text-xs mt-0.5 ${selected?.auth_user_id === r.auth_user_id ? 'text-white/80' : ''}`}
                      style={selected?.auth_user_id !== r.auth_user_id ? { color: 'var(--text-muted)' } : {}}>
                      {r.email}
                    </p>
                  </button>
                ))}
              </div>
              {selected && (
                <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <strong>{selected.display_name}</strong>을 고객으로 추가합니다.<br/>
                    추가 후 고객 상세에서 전화번호 등 정보를 입력해 주세요.
                  </p>
                  <button onClick={handleLink} disabled={linking}
                    className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-semibold">
                    {linking ? '연결 중…' : '이 계정으로 추가'}
                  </button>
                </div>
              )}
            </div>
          )
        ) : (
          /* 새 고객 추가 — 기존 ClientForm 인라인 */
          <ClientFormInline onSave={data => { onAdd(data); onClose(); }} onCancel={onClose} />
        )}
      </div>
    </Modal>
  );
}

// ClientForm을 모달 없이 인라인으로 사용하기 위한 래퍼
function ClientFormInline({ onSave, onCancel }: {
  onSave: (data: Omit<Client, 'id' | 'createdAt' | 'shopId'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', birthDate: '', gender: 'female' as Client['gender'], notes: '', tags: [] as string[] });
  const [tagInput, setTagInput] = useState('');
  const cls2 = "w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300";
  const inpSt = { borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' };
  const lbl = "block text-xs font-medium mb-1";
  const set = (k: string, v: string | string[]) => setForm(f => ({ ...f, [k]: v }));
  const addTag = () => { const t = tagInput.trim(); if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]); setTagInput(''); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    onSave({ name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || undefined, birthDate: form.birthDate || undefined, gender: form.gender, notes: form.notes.trim() || undefined, tags: form.tags.length ? form.tags : undefined });
  };
  return (
    <form onSubmit={submit} className="space-y-3 max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={lbl} style={{ color: 'var(--text-secondary)' }}>이름 *</label>
          <input required value={form.name} onChange={e => set('name', e.target.value)} className={cls2} style={inpSt} placeholder="홍길동" />
        </div>
        <div>
          <label className={lbl} style={{ color: 'var(--text-secondary)' }}>전화번호 *</label>
          <input required value={form.phone} onChange={e => set('phone', e.target.value)} className={cls2} style={inpSt} placeholder="010-0000-0000" />
        </div>
        <div>
          <label className={lbl} style={{ color: 'var(--text-secondary)' }}>성별</label>
          <select value={form.gender} onChange={e => set('gender', e.target.value)} className={cls2} style={inpSt}>
            <option value="female">여성</option>
            <option value="male">남성</option>
            <option value="other">기타</option>
          </select>
        </div>
        <div>
          <label className={lbl} style={{ color: 'var(--text-secondary)' }}>이메일</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={cls2} style={inpSt} placeholder="example@email.com" />
        </div>
        <div>
          <label className={lbl} style={{ color: 'var(--text-secondary)' }}>생년월일</label>
          <input type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} className={cls2} style={inpSt} />
        </div>
      </div>
      <div>
        <label className={lbl} style={{ color: 'var(--text-secondary)' }}>메모</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className={`${cls2} resize-none`} style={inpSt} placeholder="두피 특이사항, 알레르기 등" />
      </div>
      <div>
        <label className={lbl} style={{ color: 'var(--text-secondary)' }}>태그</label>
        <div className="flex gap-1.5 mb-1.5 flex-wrap">
          {form.tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-tag)', color: 'var(--text-tag)' }}>
              {tag}<button type="button" onClick={() => set('tags', form.tags.filter(t => t !== tag))} className="hover:text-red-500">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className={cls2} style={inpSt} placeholder="태그 입력 후 Enter" />
          <button type="button" onClick={addTag} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
            <Plus size={14} />
          </button>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 border rounded-xl py-2.5 text-sm font-medium" style={{ borderColor: 'var(--border-input)', color: 'var(--text-secondary)' }}>취소</button>
        <button type="submit" className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-2.5 text-sm font-medium">고객 추가</button>
      </div>
    </form>
  );
}

export function ClientList({ clients, consultations, onSelectClient, onAddClient, onLinkClient, onDeleteClient, shopId }: Props) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'recent' | 'visits'>('recent');
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [filterServices, setFilterServices] = useState<ServiceType[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // 사용 중인 태그 목록
  const allTags = useMemo(() => {
    const s = new Set<string>();
    clients.forEach(c => c.tags?.forEach(t => s.add(t)));
    return [...s].sort();
  }, [clients]);

  const toggleService = (s: ServiceType) =>
    setFilterServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleTag = (t: string) =>
    setFilterTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const hasFilter = filterServices.length > 0 || filterTags.length > 0;

  // 고객별 방문 수·최근 방문일·시술 종류 맵 (consultations 변경 시만 재계산)
  const clientConsultationMap = useMemo(() => {
    const map = new Map<string, { count: number; lastDate: string; serviceTypes: Set<string> }>();
    consultations.forEach(con => {
      const entry = map.get(con.clientId) ?? { count: 0, lastDate: '', serviceTypes: new Set<string>() };
      entry.count++;
      if (con.date > entry.lastDate) entry.lastDate = con.date;
      con.services.forEach(s => entry.serviceTypes.add(s.type));
      map.set(con.clientId, entry);
    });
    return map;
  }, [consultations]);

  const lastConsultationDate = (id: string) => clientConsultationMap.get(id)?.lastDate ?? '';
  const visitCount = (id: string) => clientConsultationMap.get(id)?.count ?? 0;

  const filtered = useMemo(() => {
    const searched = clients.filter(c => {
      // 텍스트 검색
      if (search && !(
        c.name.includes(search) ||
        c.phone.replace(/-/g, '').includes(search.replace(/-/g, '')) ||
        (c.email ?? '').includes(search)
      )) return false;
      // 태그 필터
      if (filterTags.length > 0 && !filterTags.every(t => c.tags?.includes(t))) return false;
      // 서비스 필터: 해당 시술 이력이 있는 고객만
      if (filterServices.length > 0) {
        const clientSvcTypes = clientConsultationMap.get(c.id)?.serviceTypes ?? new Set();
        if (!filterServices.every(s => clientSvcTypes.has(s))) return false;
      }
      return true;
    });
    return [...searched].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'ko');
      if (sortKey === 'visits') return visitCount(b.id) - visitCount(a.id);
      // 'recent': 최근 방문 기준
      const la = lastConsultationDate(a.id) || a.createdAt;
      const lb = lastConsultationDate(b.id) || b.createdAt;
      return lb.localeCompare(la);
    });
  }, [clients, clientConsultationMap, search, sortKey, filterTags, filterServices]);

  // 필터/검색 변경 시 페이지 초기화
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search, sortKey, filterTags, filterServices]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div className="p-6 space-y-5" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>고객 관리</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            총 {clients.length}명{filtered.length < clients.length ? ` · 검색 결과 ${filtered.length}명` : ''}
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> 고객 추가
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="이름, 전화번호, 이메일 검색" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }} />
        </div>
        <button onClick={() => setShowFilters(v => !v)} aria-label="필터"
          className={`relative flex-shrink-0 px-3 py-2.5 border rounded-lg transition-colors ${hasFilter ? 'bg-rose-500 border-rose-500' : ''}`}
          style={!hasFilter ? { borderColor: 'var(--border-input)', color: 'var(--text-muted)' } : {}}>
          <Filter size={15} className={hasFilter ? 'text-white' : ''} />
          {hasFilter && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {filterServices.length + filterTags.length}
            </span>
          )}
        </button>
        <div className="relative flex-shrink-0">
          <ArrowUpDown size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value as typeof sortKey)}
            className="pl-7 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 appearance-none"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
          >
            <option value="recent">최근방문순</option>
            <option value="name">이름순</option>
            <option value="visits">방문많은순</option>
          </select>
        </div>
      </div>

      {/* 필터 패널 */}
      {showFilters && (
        <div className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>시술 필터</p>
            {filterServices.length > 0 && (
              <button onClick={() => setFilterServices([])} className="text-xs" style={{ color: 'var(--text-muted)' }}>초기화</button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_SERVICE_TYPES.map(s => (
              <button key={s} onClick={() => toggleService(s)}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${filterServices.includes(s) ? 'bg-rose-500 text-white border-rose-500' : ''}`}
                style={!filterServices.includes(s) ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}>
                {SERVICE_LABELS[s]}
              </button>
            ))}
          </div>
          {allTags.length > 0 && (
            <>
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>태그 필터</p>
                {filterTags.length > 0 && (
                  <button onClick={() => setFilterTags([])} className="text-xs" style={{ color: 'var(--text-muted)' }}>초기화</button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(t => (
                  <button key={t} onClick={() => toggleTag(t)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${filterTags.includes(t) ? 'bg-amber-500 text-white border-amber-500' : ''}`}
                    style={!filterTags.includes(t) ? { borderColor: 'var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tag)' } : {}}>
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}
          {hasFilter && (
            <button onClick={() => { setFilterServices([]); setFilterTags([]); setShowFilters(false); }}
              className="w-full text-xs py-2 rounded-xl border font-medium transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              모든 필터 해제
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-2 rounded-xl border-2 border-dashed"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <Search size={28} className="opacity-30" />
            <p className="text-sm">{search ? '검색 결과가 없습니다.' : '등록된 고객이 없습니다.'}</p>
            {!search && (
              <button onClick={() => setShowForm(true)}
                className="mt-1 text-xs px-4 py-1.5 bg-rose-500 text-white rounded-lg font-medium">
                첫 고객 추가하기
              </button>
            )}
          </div>
        )}
        {visible.map(client => {
          const lastDate = lastConsultationDate(client.id);
          const count = visitCount(client.id);
          return (
            <div key={client.id} className="rounded-xl border transition-all group" style={card}>
              <button onClick={() => onSelectClient(client.id)} className="w-full flex items-center gap-4 p-4 text-left">
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-icon-rose)' }}>
                  <span className="text-base font-bold" style={{ color: 'var(--text-icon-rose)' }}>{client.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{client.name}</span>
                    {client.tags?.map(tag => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-tag)', color: 'var(--text-tag)' }}>{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <Phone size={11} />
                    <span>{client.phone}</span>
                    <span className="mx-1">·</span>
                    <span>방문 {count}회</span>
                    {lastDate && <><span className="mx-1">·</span><span>마지막 {format(parseISO(lastDate), 'yy.MM.dd')}</span></>}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
              <div className="px-4 pb-3 flex justify-end">
                <button onClick={e => { e.stopPropagation(); setDeleteTarget(client); }}
                  className="text-xs flex items-center gap-1 transition-colors hover:text-red-500" style={{ color: 'var(--text-muted)' }}>
                  <Trash2 size={12} /> 삭제
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
          className="w-full py-3 rounded-xl border text-sm font-medium transition-colors hover:border-rose-400 hover:text-rose-500"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          더 보기 ({filtered.length - visibleCount}명 남음)
        </button>
      )}

      {showForm && (
        <AddClientModal
          shopId={shopId}
          onClose={() => setShowForm(false)}
          onAdd={data => { onAddClient(data); setShowForm(false); }}
          onLink={onLinkClient}
        />
      )}
      {deleteTarget && (
        <DeleteClientModal
          client={deleteTarget}
          visitCount={visitCount(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { onDeleteClient(deleteTarget.id); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}
