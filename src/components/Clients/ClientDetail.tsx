import { useState, useMemo, lazy, Suspense } from 'react';
import { ArrowLeft, Phone, Mail, Plus, Edit2, Scissors, BarChart2, X, Tag, Image, ChevronLeft, ChevronRight as ChevronRightIcon, Camera, Download, Search, Filter } from 'lucide-react';
import { exportClientHistory } from '../../utils/csv';
import { format, parseISO, differenceInYears } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Client, Consultation, Designer } from '../../types';
import { SafeImg } from '../common/SafeImg';
import { SERVICE_LABELS, SERVICE_COLORS } from '../Consultations/serviceLabels';
import { ClientForm } from './ClientForm';
import { ConsultationForm } from '../Consultations/ConsultationForm';
import { Modal } from '../common/Modal';

// recharts 의존 — 초기 번들에서 분리
const ClientStats = lazy(() => import('./ClientStats').then(m => ({ default: m.ClientStats })));

interface Props {
  client: Client;
  consultations: Consultation[];
  designers: Designer[];
  shopId?: string;
  onBack: () => void;
  onUpdateClient: (id: string, data: Partial<Client>) => void;
  onAddConsultation: (data: Omit<Consultation, 'id' | 'shareToken' | 'createdAt' | 'shopId'>) => void;
  onSelectConsultation: (id: string) => void;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

/** 라이트박스: 사진 배열에서 인덱스 기반 탐색 */
function Lightbox({ photos, startIndex, onClose }: {
  photos: { src: string; label: string; date: string }[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);
  const photo = photos[idx];
  return (
    <Modal onClose={onClose} maxWidth="max-w-xl">
      <div className="relative">
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{photo.date} · {photo.label}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{idx + 1} / {photos.length}</p>
        </div>
        <SafeImg src={photo.src} alt={photo.label} className="w-full max-h-[70vh] object-contain bg-black" />
        {photos.length > 1 && (
          <>
            <button onClick={prev} aria-label="이전 사진"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next} aria-label="다음 사진"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
              <ChevronRightIcon size={18} />
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

export function ClientDetail({ client, consultations, designers, shopId, onBack, onUpdateClient, onAddConsultation, onSelectConsultation }: Props) {
  const [showEditClient, setShowEditClient] = useState(false);
  const [showAddCon, setShowAddCon] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'gallery' | 'stats'>('history');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [monthFilter, setMonthFilter] = useState('');   // 'YYYY-MM' 또는 ''(전체)
  const [historySearch, setHistorySearch] = useState('');  // 텍스트 검색
  const [historyServiceFilter, setHistoryServiceFilter] = useState<string[]>([]); // 시술 종류 필터
  const [showHistoryFilter, setShowHistoryFilter] = useState(false);
  const [tagInput, setTagInput] = useState('');         // P2-21: 인라인 태그 입력

  const allSorted = useMemo(
    () => [...consultations].sort((a, b) => b.date.localeCompare(a.date)),
    [consultations],
  );

  const sorted = useMemo(() => {
    return allSorted.filter(c => {
      if (monthFilter && !c.date.startsWith(monthFilter)) return false;
      if (historySearch) {
        const q = historySearch.toLowerCase();
        const inServices = c.services.some(s =>
          SERVICE_LABELS[s.type].includes(historySearch) || s.description?.toLowerCase().includes(q)
        );
        const inNote = c.notes?.toLowerCase().includes(q);
        const inDesigner = c.stylistName.toLowerCase().includes(q);
        if (!inServices && !inNote && !inDesigner) return false;
      }
      if (historyServiceFilter.length > 0) {
        const types = new Set(c.services.map(s => s.type));
        if (!historyServiceFilter.every(t => types.has(t as never))) return false;
      }
      return true;
    });
  }, [allSorted, monthFilter, historySearch, historyServiceFilter]);

  // 이력에 있는 연월 목록 추출
  const monthOptions = useMemo(() => {
    const set = new Set(allSorted.map(c => c.date.slice(0, 7)));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [allSorted]);

  // 이 고객의 시술 종류 목록
  const usedServiceTypes = useMemo(() => {
    const set = new Set(allSorted.flatMap(c => c.services.map(s => s.type)));
    return [...set];
  }, [allSorted]);
  const age = client.birthDate ? differenceInYears(new Date(), parseISO(client.birthDate)) : null;
  const totalSpend = consultations.reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);

  // 갤러리: 시간순(오래된→최신) before+after 수집
  const galleryPhotos = useMemo(() => {
    const items: { src: string; label: string; date: string }[] = [];
    [...allSorted].reverse().forEach(con => {
      const d = format(parseISO(con.date), 'yy.MM.dd', { locale: ko });
      if (con.beforePhoto) items.push({ src: con.beforePhoto, label: 'Before', date: d });
      if (con.afterPhoto)  items.push({ src: con.afterPhoto,  label: 'After',  date: d });
    });
    return items;
  }, [allSorted]);

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="flex items-center gap-3">
        <button onClick={onBack} aria-label="뒤로 가기" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold truncate flex-1" style={{ color: 'var(--text-primary)' }}>고객 상세</h1>
        {consultations.length > 0 && (
          <button
            onClick={() => exportClientHistory(client, consultations)}
            aria-label="시술 이력 CSV 내보내기"
            title="CSV 내보내기"
            className="p-1.5 rounded-lg transition-colors hover:text-rose-500"
            style={{ color: 'var(--text-muted)' }}>
            <Download size={16} />
          </button>
        )}
      </div>

      {/* Profile */}
      <div className="rounded-2xl border p-5" style={card}>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--bg-icon-rose)' }}>
            <span className="text-2xl font-bold" style={{ color: 'var(--text-icon-rose)' }}>{client.name.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{client.name}</h2>
                  {client.gender === 'female' && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-tag-rose)', color: 'var(--text-icon-rose)' }}>여성</span>}
                  {client.gender === 'male' && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-icon-blue)', color: 'var(--text-icon-blue)' }}>남성</span>}
                </div>
                {age !== null && <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{age}세 · {client.birthDate}</p>}
              </div>
              <button onClick={() => setShowEditClient(true)} aria-label="고객 정보 수정" className="p-1 hover:text-rose-500" style={{ color: 'var(--text-muted)' }}><Edit2 size={16} /></button>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}><Phone size={13} style={{ color: 'var(--text-muted)' }} /><a href={`tel:${client.phone.replace(/-/g, '')}`} className="hover:underline" style={{ color: 'inherit' }}>{client.phone}</a></div>
              {client.email && <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}><Mail size={13} style={{ color: 'var(--text-muted)' }} />{client.email}</div>}
            </div>
            {client.tags?.length && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {client.tags.map(tag => <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-tag)', color: 'var(--text-tag)' }}>{tag}</span>)}
              </div>
            )}
            {/* P2-21: 인라인 태그 관리 */}
            <div className="mt-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Tag size={11} style={{ color: 'var(--text-muted)' }} />
                {(client.tags ?? []).map(tag => (
                  <span key={tag} className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--bg-tag)', color: 'var(--text-tag)' }}>
                    {tag}
                    <button
                      onClick={() => onUpdateClient(client.id, { tags: client.tags?.filter(t => t !== tag) })}
                      aria-label={`태그 '${tag}' 삭제`}
                      className="ml-0.5 hover:opacity-60"><X size={10} /></button>
                  </span>
                ))}
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const t = tagInput.trim();
                    if (t && !(client.tags ?? []).includes(t)) {
                      onUpdateClient(client.id, { tags: [...(client.tags ?? []), t] });
                    }
                    setTagInput('');
                  }}
                  className="flex items-center gap-1">
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    placeholder="태그 추가"
                    className="w-20 text-xs border rounded-full px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-rose-300"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                  />
                  <button type="submit" aria-label="태그 추가" className="text-rose-500 hover:text-rose-700"><Plus size={13} /></button>
                </form>
              </div>
            </div>
            {client.notes && <p className="mt-3 text-xs rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--bg-note)', color: 'var(--text-secondary)' }}>{client.notes}</p>}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4" style={{ borderColor: 'var(--border)' }}>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{consultations.length}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>총 방문 횟수</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalSpend.toLocaleString()}원</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>총 매출</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: 'var(--bg-muted)' }}>
        {([
          ['history', '상담 이력', Scissors],
          ['gallery', `사진 (${galleryPhotos.length})`, Camera],
          ['stats', '통계/차트', BarChart2],
        ] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
            style={activeTab === id
              ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow)' }
              : { color: 'var(--text-muted)' }}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && (
        <Suspense fallback={<div className="flex items-center justify-center p-16 text-sm" style={{ color: 'var(--text-muted)' }}>차트 로딩중…</div>}>
          <ClientStats consultations={consultations} />
        </Suspense>
      )}

      {activeTab === 'gallery' && (
        <div>
          {galleryPhotos.length === 0 ? (
            <div className="rounded-xl py-14 text-center border-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
              <Image size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>저장된 사진이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {galleryPhotos.map((p, i) => (
                <button key={i} onClick={() => setLightboxIndex(i)}
                  className="relative aspect-square rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-rose-400"
                  aria-label={`${p.date} ${p.label} 사진 보기`}>
                  <SafeImg src={p.src} alt={`${p.date} ${p.label}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[10px] font-medium text-white"
                    style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
                    {p.date} {p.label}
                  </div>
                </button>
              ))}
            </div>
          )}
          {lightboxIndex !== null && (
            <Lightbox photos={galleryPhotos} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          {/* 검색 + 필터 헤더 */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="시술명, 메모, 디자이너 검색"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-300"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                />
              </div>
              {monthOptions.length > 1 && (
                <select
                  value={monthFilter}
                  onChange={e => setMonthFilter(e.target.value)}
                  className="border rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300 flex-shrink-0"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                >
                  <option value="">전체 월</option>
                  {monthOptions.map(m => (
                    <option key={m} value={m}>{m.replace('-', '년 ')}월</option>
                  ))}
                </select>
              )}
              {usedServiceTypes.length > 0 && (
                <button
                  onClick={() => setShowHistoryFilter(v => !v)}
                  aria-label="시술 필터"
                  className={`flex-shrink-0 p-2 rounded-lg border transition-colors ${historyServiceFilter.length > 0 ? 'bg-rose-500 border-rose-500 text-white' : ''}`}
                  style={historyServiceFilter.length === 0 ? { borderColor: 'var(--border-input)', color: 'var(--text-muted)' } : {}}>
                  <Filter size={13} />
                </button>
              )}
              <button onClick={() => setShowAddCon(true)} className="flex-shrink-0 flex items-center gap-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
                <Plus size={13} /> 추가
              </button>
            </div>
            {showHistoryFilter && usedServiceTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                {usedServiceTypes.map(t => (
                  <button key={t}
                    onClick={() => setHistoryServiceFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${historyServiceFilter.includes(t) ? 'bg-rose-500 text-white border-rose-500' : ''}`}
                    style={!historyServiceFilter.includes(t) ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}>
                    {SERVICE_LABELS[t as keyof typeof SERVICE_LABELS]}
                  </button>
                ))}
                {historyServiceFilter.length > 0 && (
                  <button onClick={() => setHistoryServiceFilter([])} className="text-xs px-2 py-1 rounded-full" style={{ color: 'var(--text-muted)' }}>초기화</button>
                )}
              </div>
            )}
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {sorted.length !== allSorted.length ? `${sorted.length} / ${allSorted.length}건` : `총 ${allSorted.length}건`}
            </p>
          </div>
          {sorted.length === 0 && (
            <div className="rounded-xl py-12 text-center text-sm border-2 border-dashed" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
              <Scissors size={32} className="mx-auto mb-2 opacity-30" />아직 상담 이력이 없습니다.
            </div>
          )}
          <div className="relative">
            {sorted.length > 0 && <div className="absolute left-5 top-0 bottom-0 w-px" style={{ backgroundColor: 'var(--border)' }} />}
            <div className="space-y-3">
              {sorted.map(con => (
                <button key={con.id} onClick={() => onSelectConsultation(con.id)} className="relative w-full flex gap-4 text-left">
                  <div className="relative z-10 w-10 h-10 rounded-full border-2 border-rose-200 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'var(--bg-card)' }}>
                    <Scissors size={14} className="text-rose-400" />
                  </div>
                  <div className="flex-1 rounded-xl p-4 border transition-all" style={card}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {format(parseISO(con.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{con.stylistName} 스타일리스트</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {con.isShared && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-success)', color: 'var(--text-success)' }}>공유중</span>}
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{con.services.reduce((s, svc) => s + (svc.price ?? 0), 0).toLocaleString()}원</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {con.services.map((svc, i) => <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${SERVICE_COLORS[svc.type]}`}>{SERVICE_LABELS[svc.type]}</span>)}
                    </div>
                    {con.afterPhoto && <SafeImg src={con.afterPhoto} alt="after" className="mt-3 w-16 h-16 object-cover rounded-lg" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showEditClient && <ClientForm initial={client} onSave={data => { onUpdateClient(client.id, data); setShowEditClient(false); }} onClose={() => setShowEditClient(false)} />}
      {showAddCon && (
        <ConsultationForm
          clientId={client.id}
          clientName={client.name}
          shopId={shopId}
          designers={designers}
          lastConsultation={allSorted[0]}
          onSave={data => { onAddConsultation(data); setShowAddCon(false); }}
          onClose={() => setShowAddCon(false)}
        />
      )}
    </div>
  );
}
