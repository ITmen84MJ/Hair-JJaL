import { useState, useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, addMonths, subMonths as subMo } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarDays, Clock, CheckCircle2, XCircle, User, MessageSquare, ChevronDown, ChevronLeft, ChevronRight, LayoutList, Search, Filter, X as XIcon } from 'lucide-react';
import { Booking, BookingStatus, AuthUser } from '../../types';
import { SERVICE_LABELS, SERVICE_COLORS } from '../Consultations/serviceLabels';
import { Modal } from '../common/Modal';
import { toast } from '../../hooks/useToast';

interface Props {
  bookings: Booking[];
  user: AuthUser;
  onUpdate: (id: string, data: Partial<Booking>) => void;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

const STATUS_STYLES: Record<BookingStatus, { label: string; bg: string; border: string; text: string }> = {
  pending:   { label: '대기중', bg: 'var(--bg-warning)', border: 'var(--border-warning)', text: 'var(--text-warning)' },
  confirmed: { label: '확정',   bg: 'var(--bg-success)', border: 'var(--border-success)', text: 'var(--text-success)' },
  cancelled: { label: '취소',   bg: 'var(--bg-neutral)', border: 'var(--border-neutral)', text: 'var(--text-neutral)' },
};

const TABS: { id: BookingStatus | 'all'; label: string }[] = [
  { id: 'all',       label: '전체' },
  { id: 'pending',   label: '대기' },
  { id: 'confirmed', label: '확정' },
  { id: 'cancelled', label: '취소' },
];

function ConfirmModal({ clientName, onClose, onConfirm }: { clientName: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4">
        <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>예약 확정</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{clientName}</span> 고객의 예약을 확정하시겠습니까?
        </p>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>돌아가기</button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold">확정</button>
        </div>
      </div>
    </Modal>
  );
}

function CancelModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4">
        <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>예약 취소</h3>
        <textarea
          rows={3}
          placeholder="취소 사유 (선택)"
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
          style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
        />
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>돌아가기</button>
          <button onClick={() => onConfirm(reason)}
            className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold">취소 처리</button>
        </div>
      </div>
    </Modal>
  );
}

/** 월간 캘린더 — 날짜별 예약 배지 */
function CalendarView({ bookings, onSelectDate }: {
  bookings: Booking[];
  onSelectDate: (date: string) => void;
}) {
  const [curMonth, setCurMonth] = useState(new Date());
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];

  const days = useMemo(() => {
    const start = startOfMonth(curMonth);
    const end   = endOfMonth(curMonth);
    const prefix = getDay(start); // 0=일
    const all = eachDayOfInterval({ start, end });
    return { prefix, all };
  }, [curMonth]);

  const dotsByDate = useMemo(() => {
    const m: Record<string, { pending: number; confirmed: number }> = {};
    bookings.forEach(b => {
      if (!isSameMonth(parseISO(b.requestedDate), curMonth)) return;
      if (!m[b.requestedDate]) m[b.requestedDate] = { pending: 0, confirmed: 0 };
      if (b.status === 'pending')   m[b.requestedDate].pending++;
      if (b.status === 'confirmed') m[b.requestedDate].confirmed++;
    });
    return m;
  }, [bookings, curMonth]);

  return (
    <div className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCurMonth(m => subMo(m, 1))} aria-label="이전 달"
          className="p-1.5 rounded-lg hover:opacity-60 transition-opacity" style={{ color: 'var(--text-muted)' }}>
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {format(curMonth, 'yyyy년 M월', { locale: ko })}
        </span>
        <button onClick={() => setCurMonth(m => addMonths(m, 1))} aria-label="다음 달"
          className="p-1.5 rounded-lg hover:opacity-60 transition-opacity" style={{ color: 'var(--text-muted)' }}>
          <ChevronRight size={16} />
        </button>
      </div>
      {/* DOW header */}
      <div className="grid grid-cols-7 mb-1">
        {DOW.map(d => (
          <div key={d} className="text-center text-[11px] font-medium py-1"
            style={{ color: d === '일' ? 'var(--text-danger)' : d === '토' ? 'var(--text-info)' : 'var(--text-muted)' }}>
            {d}
          </div>
        ))}
      </div>
      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {/* Prefix empty cells */}
        {Array.from({ length: days.prefix }).map((_, i) => <div key={`p${i}`} />)}
        {days.all.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const dots = dotsByDate[key];
          const today = isToday(day);
          const col = getDay(day) === 0 ? 'var(--text-danger)' : getDay(day) === 6 ? 'var(--text-info)' : 'var(--text-primary)';
          return (
            <button
              key={key}
              onClick={() => dots && onSelectDate(key)}
              disabled={!dots}
              aria-label={`${format(day, 'M월 d일')} ${dots ? `예약 ${(dots.pending + dots.confirmed)}건` : ''}`}
              className={`flex flex-col items-center py-1 rounded-lg transition-colors ${dots ? 'cursor-pointer hover:opacity-70' : ''}`}
              style={today ? { backgroundColor: 'var(--bg-icon-rose)' } : {}}>
              <span className="text-xs font-medium" style={{ color: col }}>{format(day, 'd')}</span>
              {dots && (
                <div className="flex gap-0.5 mt-0.5">
                  {dots.pending   > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  {dots.confirmed > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex gap-4 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" /> 대기
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" /> 확정
        </span>
      </div>
    </div>
  );
}

export function BookingList({ bookings, user, onUpdate }: Props) {
  const [tab, setTab] = useState<BookingStatus | 'all'>('pending');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarDateFilter, setCalendarDateFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Designer sees only bookings for their name (or no preference)
  const mine = user.role === 'designer' && user.designerName
    ? bookings.filter(b => !b.preferredDesigner || b.preferredDesigner === user.designerName)
    : bookings;

  const filtered = useMemo(() => {
    let result = tab === 'all' ? mine : mine.filter(b => b.status === tab);
    if (calendarDateFilter) result = result.filter(b => b.requestedDate === calendarDateFilter);
    if (dateFrom) result = result.filter(b => b.requestedDate >= dateFrom);
    if (dateTo)   result = result.filter(b => b.requestedDate <= dateTo);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(b =>
        b.clientName.toLowerCase().includes(q) ||
        (b.preferredDesigner ?? '').toLowerCase().includes(q) ||
        (b.notes ?? '').toLowerCase().includes(q),
      );
    }
    return result;
  }, [mine, tab, calendarDateFilter, dateFrom, dateTo, search]);
  const sorted = [...filtered].sort((a, b) => a.requestedDate.localeCompare(b.requestedDate));

  const confirm = (id: string) => {
    onUpdate(id, { status: 'confirmed', confirmedBy: user.designerName ?? user.name });
    setConfirmTarget(null);
    toast.success('예약이 확정되었습니다.');
  };
  const cancel = (id: string, reason: string) => {
    onUpdate(id, { status: 'cancelled', cancelReason: reason || undefined });
    setCancelTarget(null);
    toast.info('예약이 취소되었습니다.');
  };

  const counts = {
    all: mine.length,
    pending: mine.filter(b => b.status === 'pending').length,
    confirmed: mine.filter(b => b.status === 'confirmed').length,
    cancelled: mine.filter(b => b.status === 'cancelled').length,
  };

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>예약 관리</h1>
        {/* 뷰 토글 */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-muted)' }}>
          <button onClick={() => { setViewMode('list'); setCalendarDateFilter(null); }}
            aria-label="목록 보기"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)', backgroundColor: viewMode === 'list' ? 'var(--bg-card)' : 'transparent', boxShadow: viewMode === 'list' ? 'var(--shadow)' : 'none' }}>
            <LayoutList size={15} />
          </button>
          <button onClick={() => setViewMode('calendar')}
            aria-label="캘린더 보기"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: viewMode === 'calendar' ? 'var(--text-primary)' : 'var(--text-muted)', backgroundColor: viewMode === 'calendar' ? 'var(--bg-card)' : 'transparent', boxShadow: viewMode === 'calendar' ? 'var(--shadow)' : 'none' }}>
            <CalendarDays size={15} />
          </button>
        </div>
      </div>

      {/* 검색 + 날짜 필터 */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="고객명·디자이너·메모 검색"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border rounded-xl pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2"
                aria-label="검색 초기화" style={{ color: 'var(--text-muted)' }}>
                <XIcon size={13} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowDateFilter(v => !v)}
            aria-label="날짜 필터"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-colors ${showDateFilter || dateFrom || dateTo ? 'bg-rose-500 text-white border-rose-500' : ''}`}
            style={!(showDateFilter || dateFrom || dateTo) ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}>
            <Filter size={14} />
            {(dateFrom || dateTo) ? '날짜 적용 중' : '날짜'}
          </button>
        </div>

        {showDateFilter && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <label className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>시작</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="flex-1 border rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>~</span>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <label className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>종료</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="flex-1 border rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
            </div>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-xs px-2.5 py-1.5 rounded-xl border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                초기화
              </button>
            )}
          </div>
        )}
      </div>

      {/* 캘린더 뷰 */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          <CalendarView bookings={mine} onSelectDate={date => {
            setCalendarDateFilter(prev => prev === date ? null : date);
            setTab('all');
            setViewMode('list');
          }} />
        </div>
      )}

      {/* List view: tabs + cards */}
      {viewMode === 'list' && <><div className="flex gap-1.5 flex-wrap">
        {calendarDateFilter && (
          <div className="w-full flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ backgroundColor: 'var(--bg-icon-rose)', color: 'var(--text-icon-rose)' }}>
              📅 {calendarDateFilter}
            </span>
            <button onClick={() => setCalendarDateFilter(null)}
              className="text-xs" style={{ color: 'var(--text-muted)' }}>✕ 필터 해제</button>
          </div>
        )}
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              tab === id ? 'bg-rose-500 text-white border-rose-500' : ''
            }`}
            style={tab !== id ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}
          >
            {label}
            {counts[id] > 0 && (
              <span className={`text-xs px-1.5 rounded-full font-bold ml-0.5 ${tab === id ? 'bg-white/30 text-white' : ''}`}
                style={tab !== id ? { backgroundColor: 'var(--bg-icon-rose)', color: 'var(--text-icon-rose)' } : {}}>
                {counts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Booking cards */}
      {sorted.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed py-16 flex flex-col items-center gap-2"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <p className="text-sm">
            {search.trim() || dateFrom || dateTo || calendarDateFilter
              ? '검색 또는 필터 조건에 맞는 예약이 없습니다.'
              : tab === 'pending'   ? '대기 중인 예약이 없습니다.'
              : tab === 'confirmed' ? '확정된 예약이 없습니다.'
              : tab === 'cancelled' ? '취소된 예약이 없습니다.'
              : '예약이 없습니다.'}
          </p>
          {(search.trim() || dateFrom || dateTo || calendarDateFilter) && (
            <button onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setCalendarDateFilter(null); }}
              className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              필터 초기화
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(b => {
            const ss = STATUS_STYLES[b.status];
            const isOpen = expanded === b.id;
            return (
              <div key={b.id} className="rounded-2xl border overflow-hidden" style={card}>
                {/* Card header */}
                <button
                  className="w-full text-left px-5 py-4"
                  onClick={() => setExpanded(isOpen ? null : b.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {b.clientName}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full border font-medium"
                          style={{ backgroundColor: ss.bg, borderColor: ss.border, color: ss.text }}>{ss.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <CalendarDays size={11} className="text-rose-400" />
                          {format(parseISO(b.requestedDate), 'M월 d일 (EEE)', { locale: ko })}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <Clock size={11} className="text-rose-400" />
                          {b.requestedTime}
                        </span>
                        {b.preferredDesigner && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <User size={11} className="text-rose-400" />
                            {b.preferredDesigner}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {b.serviceTypes.map(s => (
                          <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${SERVICE_COLORS[s]}`}>
                            {SERVICE_LABELS[s]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronDown size={16} className={`flex-shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      style={{ color: 'var(--text-muted)' }} />
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-5 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    {b.notes && (
                      <div className="flex gap-2 pt-3">
                        <MessageSquare size={13} className="text-rose-300 flex-shrink-0 mt-0.5" />
                        <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{b.notes}</p>
                      </div>
                    )}
                    {b.cancelReason && (
                      <p className="text-xs px-3 py-2 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-danger)', color: 'var(--text-danger)' }}>취소 사유: {b.cancelReason}</p>
                    )}
                    {b.confirmedBy && b.status === 'confirmed' && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>확정: {b.confirmedBy}</p>
                    )}

                    {/* Actions */}
                    {b.status === 'pending' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setConfirmTarget(b.id)}
                          className="flex items-center gap-1.5 flex-1 justify-center py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
                        >
                          <CheckCircle2 size={14} /> 예약 확정
                        </button>
                        <button
                          onClick={() => setCancelTarget(b.id)}
                          className="flex items-center gap-1.5 flex-1 justify-center py-3 rounded-xl border text-sm font-medium transition-colors"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'var(--bg-danger)'; el.style.color = 'var(--text-danger)'; el.style.borderColor = 'var(--border-danger)'; }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = ''; el.style.color = 'var(--text-secondary)'; el.style.borderColor = 'var(--border)'; }}
                        >
                          <XCircle size={14} /> 취소
                        </button>
                      </div>
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => setCancelTarget(b.id)}
                        className="flex items-center gap-1.5 w-full justify-center py-3 rounded-xl border text-sm font-medium transition-colors"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'var(--bg-danger)'; el.style.color = 'var(--text-danger)'; el.style.borderColor = 'var(--border-danger)'; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = ''; el.style.color = 'var(--text-secondary)'; el.style.borderColor = 'var(--border)'; }}
                      >
                        <XCircle size={14} /> 예약 취소
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      </>}

      {confirmTarget && (() => {
        const b = sorted.find(x => x.id === confirmTarget);
        return b ? (
          <ConfirmModal
            clientName={b.clientName}
            onClose={() => setConfirmTarget(null)}
            onConfirm={() => confirm(confirmTarget)}
          />
        ) : null;
      })()}

      {cancelTarget && (
        <CancelModal
          onClose={() => setCancelTarget(null)}
          onConfirm={reason => cancel(cancelTarget, reason)}
        />
      )}
    </div>
  );
}
