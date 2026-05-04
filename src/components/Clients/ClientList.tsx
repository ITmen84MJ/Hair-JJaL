import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Phone, ChevronRight, Trash2, AlertTriangle, ArrowUpDown, Filter } from 'lucide-react';
import { Client, Consultation, ServiceType } from '../../types';
import { ClientForm } from './ClientForm';
import { Modal } from '../common/Modal';
import { format, parseISO } from 'date-fns';
import { SERVICE_LABELS } from '../Consultations/serviceLabels';

const ALL_SERVICE_TYPES: ServiceType[] = ['cut', 'color', 'bleach', 'perm', 'straightening', 'treatment', 'scalp', 'styling', 'other'];

interface Props {
  clients: Client[];
  consultations: Consultation[];
  onSelectClient: (id: string) => void;
  onAddClient: (data: Omit<Client, 'id' | 'createdAt' | 'shopId'>) => void;
  onDeleteClient: (id: string) => void;
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

export function ClientList({ clients, consultations, onSelectClient, onAddClient, onDeleteClient }: Props) {
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
                <div className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-base font-bold text-rose-600">{client.name.charAt(0)}</span>
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

      {showForm && <ClientForm onSave={data => { onAddClient(data); setShowForm(false); }} onClose={() => setShowForm(false)} />}
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
