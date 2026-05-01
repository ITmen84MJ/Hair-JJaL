import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarDays, Clock, CheckCircle2, XCircle, User, Scissors, MessageSquare, ChevronDown } from 'lucide-react';
import { Booking, BookingStatus, AuthUser } from '../../types';
import { SERVICE_LABELS } from '../Consultations/serviceLabels';

interface Props {
  bookings: Booking[];
  user: AuthUser;
  onUpdate: (id: string, data: Partial<Booking>) => void;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

const STATUS_INFO: Record<BookingStatus, { label: string; cls: string }> = {
  pending:   { label: '대기중',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: '확정',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: '취소',    cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const TABS: { id: BookingStatus | 'all'; label: string }[] = [
  { id: 'all',       label: '전체' },
  { id: 'pending',   label: '대기' },
  { id: 'confirmed', label: '확정' },
  { id: 'cancelled', label: '취소' },
];

function CancelModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={card}>
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
            className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>돌아가기</button>
          <button onClick={() => onConfirm(reason)}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold">취소 처리</button>
        </div>
      </div>
    </div>
  );
}

export function BookingList({ bookings, user, onUpdate }: Props) {
  const [tab, setTab] = useState<BookingStatus | 'all'>('pending');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Designer sees only bookings for their name (or no preference)
  const mine = user.role === 'designer' && user.designerName
    ? bookings.filter(b => !b.preferredDesigner || b.preferredDesigner === user.designerName)
    : bookings;

  const filtered = tab === 'all' ? mine : mine.filter(b => b.status === tab);
  const sorted = [...filtered].sort((a, b) => a.requestedDate.localeCompare(b.requestedDate));

  const confirm = (id: string) => {
    onUpdate(id, { status: 'confirmed', confirmedBy: user.designerName ?? user.name });
  };
  const cancel = (id: string, reason: string) => {
    onUpdate(id, { status: 'cancelled', cancelReason: reason || undefined });
    setCancelTarget(null);
  };

  const counts = {
    all: mine.length,
    pending: mine.filter(b => b.status === 'pending').length,
    confirmed: mine.filter(b => b.status === 'confirmed').length,
    cancelled: mine.filter(b => b.status === 'cancelled').length,
  };

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>예약 관리</h1>

      {/* Tabs */}
      <div className="flex gap-1.5">
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
              <span className={`text-xs px-1.5 rounded-full font-bold ml-0.5 ${
                tab === id ? 'bg-white/30 text-white' : 'bg-rose-100 text-rose-600'
              }`}>
                {counts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Booking cards */}
      {sorted.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed py-16 text-center"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          해당 예약이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(b => {
            const { label, cls } = STATUS_INFO[b.status];
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
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>{label}</span>
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
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
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
                      <p className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-600">취소 사유: {b.cancelReason}</p>
                    )}
                    {b.confirmedBy && b.status === 'confirmed' && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>확정: {b.confirmedBy}</p>
                    )}

                    {/* Actions */}
                    {b.status === 'pending' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => confirm(b.id)}
                          className="flex items-center gap-1.5 flex-1 justify-center py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
                        >
                          <CheckCircle2 size={14} /> 예약 확정
                        </button>
                        <button
                          onClick={() => setCancelTarget(b.id)}
                          className="flex items-center gap-1.5 flex-1 justify-center py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        >
                          <XCircle size={14} /> 취소
                        </button>
                      </div>
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => setCancelTarget(b.id)}
                        className="flex items-center gap-1.5 w-full justify-center py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
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

      {cancelTarget && (
        <CancelModal
          onClose={() => setCancelTarget(null)}
          onConfirm={reason => cancel(cancelTarget, reason)}
        />
      )}
    </div>
  );
}
