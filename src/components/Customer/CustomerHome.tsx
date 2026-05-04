import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState } from 'react';
import { Scissors, Calendar, ChevronRight, Clock, CalendarPlus, CheckCircle2, XCircle, HourglassIcon, MapPin, Phone as PhoneIcon, Store } from 'lucide-react';
import { Client, Consultation, Booking, BookingStatus, Shop } from '../../types';
import { SafeImg } from '../common/SafeImg';
import { SERVICE_LABELS, SERVICE_COLORS } from '../Consultations/serviceLabels';

interface Props {
  client: Client | null;
  consultations: Consultation[];
  bookings: Booking[];
  shops?: Shop[];
  onSelectConsultation: (id: string) => void;
  onNewBooking: () => void;
  onCancelBooking?: (id: string) => void;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

const BOOKING_STATUS: Record<BookingStatus, { label: string; Icon: React.ElementType; bg: string; text: string }> = {
  pending:   { label: '대기중', Icon: HourglassIcon, bg: 'var(--bg-warning)', text: 'var(--text-warning)' },
  confirmed: { label: '확정',   Icon: CheckCircle2,  bg: 'var(--bg-success)', text: 'var(--text-success)' },
  cancelled: { label: '취소됨', Icon: XCircle,       bg: 'var(--bg-neutral)', text: 'var(--text-neutral)' },
};

export function CustomerHome({ client, consultations, bookings, shops = [], onSelectConsultation, onNewBooking, onCancelBooking }: Props) {
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-app)' }}>
        <div className="text-center">
          <Scissors size={40} className="mx-auto mb-3 text-rose-300" />
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>연결된 고객 정보가 없습니다.</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>헤어샵에 방문 후 상담 기록을 확인해보세요.</p>
        </div>
      </div>
    );
  }

  const sorted = [...consultations].sort((a, b) => b.date.localeCompare(a.date));
  const next = sorted.find(c => c.nextVisitDate && c.nextVisitDate > new Date().toISOString().slice(0, 10));
  const totalSpend = consultations.reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);

  // 가장 최근 시술이 이뤄진 지점
  const recentShop = sorted[0]?.shopId
    ? shops.find(s => s.id === sorted[0].shopId) ?? null
    : null;

  // Only show non-cancelled bookings, sorted newest first
  const myBookings = [...bookings]
    .filter(b => b.status !== 'cancelled')
    .sort((a, b) => b.requestedDate.localeCompare(a.requestedDate));

  return (
    <div className="p-5 space-y-5 max-w-lg mx-auto" style={{ backgroundColor: 'var(--bg-app)' }}>

      {/* Welcome */}
      <div className="rounded-2xl p-5 border" style={{ ...card, backgroundColor: 'var(--bg-card-warm)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-icon-rose)' }}>
              <span className="text-2xl font-bold" style={{ color: 'var(--text-icon-rose)' }}>{client.name.charAt(0)}</span>
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{client.name} 고객님</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>방문 {consultations.length}회 · 총 {totalSpend.toLocaleString()}원</p>
            </div>
          </div>
          {/* 예약 버튼 */}
          <button
            onClick={onNewBooking}
            className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-sm shadow-rose-200"
          >
            <CalendarPlus size={20} />
            <span className="text-xs font-semibold">예약하기</span>
          </button>
        </div>
      </div>

      {/* My bookings */}
      {myBookings.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Calendar size={16} className="text-rose-400" /> 나의 예약
          </h2>
          {myBookings.map(b => {
            const { label, Icon, bg, text } = BOOKING_STATUS[b.status];
            const canCancel = b.status === 'pending' && onCancelBooking;
            return (
              <div key={b.id}>
                <div className="rounded-2xl border p-4 flex items-center gap-4" style={card}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: bg, color: text }}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {format(parseISO(b.requestedDate), 'M월 d일 (EEE)', { locale: ko })} {b.requestedTime}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {b.serviceTypes.map(s => (
                        <span key={s} className={`text-xs px-1.5 py-0.5 rounded-full ${SERVICE_COLORS[s]}`}>
                          {SERVICE_LABELS[s]}
                        </span>
                      ))}
                    </div>
                    {b.preferredDesigner && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{b.preferredDesigner} 디자이너</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                      style={{ backgroundColor: bg, color: text }}>{label}</span>
                    {canCancel && (
                      <button
                        onClick={() => setConfirmCancelId(b.id)}
                        className="text-xs px-2 py-1 rounded-lg border transition-colors hover:bg-red-50"
                        style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
                      >
                        취소
                      </button>
                    )}
                  </div>
                </div>
                {/* 취소 확인 */}
                {confirmCancelId === b.id && (
                  <div className="mt-1 rounded-2xl border p-3 flex items-center justify-between gap-3"
                    style={{ backgroundColor: 'var(--bg-danger-soft, #fff1f2)', borderColor: '#fecdd3' }}>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>예약을 취소할까요?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmCancelId(null)}
                        className="text-xs px-3 py-1.5 rounded-lg border"
                        style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
                      >
                        아니오
                      </button>
                      <button
                        onClick={() => { onCancelBooking!(b.id); setConfirmCancelId(null); }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium"
                      >
                        취소하기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Next visit recommendation */}
      {next?.nextVisitDate && (
        <div className="rounded-2xl p-4 border flex items-center gap-3"
          style={{ backgroundColor: 'var(--bg-warning)', borderColor: 'var(--border-warning)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--bg-warning-soft)' }}>
            <Clock size={18} style={{ color: 'var(--text-warning)' }} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-warning)' }}>다음 방문 권장일</p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-warning-2)' }}>
              {format(parseISO(next.nextVisitDate), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
            </p>
            {next.nextVisitNote && <p className="text-xs" style={{ color: 'var(--text-warning)' }}>{next.nextVisitNote}</p>}
          </div>
          <button onClick={onNewBooking}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium">
            예약
          </button>
        </div>
      )}

      {/* 최근 방문 지점 정보 */}
      {recentShop && (recentShop.address || recentShop.phone || recentShop.openTime) && (
        <div className="rounded-2xl border p-4 space-y-2" style={card}>
          <div className="flex items-center gap-2 mb-1">
            <Store size={14} className="text-rose-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{recentShop.name}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>최근 방문 지점</p>
            </div>
          </div>
          {recentShop.phone && (
            <a href={`tel:${recentShop.phone}`}
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: 'var(--text-secondary)' }}>
              <PhoneIcon size={13} className="text-rose-300 flex-shrink-0" />
              <span>{recentShop.phone}</span>
            </a>
          )}
          {recentShop.address && (
            <a href={`https://map.kakao.com/?q=${encodeURIComponent(recentShop.address)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: 'var(--text-secondary)' }}>
              <MapPin size={13} className="text-rose-300 flex-shrink-0" />
              <span className="underline underline-offset-2">{recentShop.address}</span>
            </a>
          )}
          {(recentShop.openTime || recentShop.closeTime) && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Clock size={13} className="text-rose-300 flex-shrink-0" />
              <span>{recentShop.openTime ?? '?'} – {recentShop.closeTime ?? '?'}</span>
            </div>
          )}
        </div>
      )}

      {/* Consultation history */}
      <div>
        <h2 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Scissors size={16} className="text-rose-400" /> 시술 이력
        </h2>
        {sorted.length === 0 && (
          <div className="rounded-xl py-12 text-center border-2 border-dashed space-y-3" style={{ borderColor: 'var(--border)' }}>
            <Scissors size={32} className="mx-auto text-rose-200" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>아직 시술 이력이 없습니다.</p>
            <button onClick={onNewBooking}
              className="text-xs px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-colors">
              예약하러 가기
            </button>
          </div>
        )}
        <div className="space-y-3">
          {sorted.map(con => (
            <button key={con.id} onClick={() => onSelectConsultation(con.id)}
              className="w-full rounded-2xl border p-4 text-left hover:shadow-md transition-all group"
              style={card}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {format(parseISO(con.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{con.stylistName} 스타일리스트</p>
                </div>
                <ChevronRight size={16} className="text-rose-300 group-hover:text-rose-500 transition-colors mt-0.5" />
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {con.services.map((svc, i) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${SERVICE_COLORS[svc.type]}`}>
                    {SERVICE_LABELS[svc.type]}
                  </span>
                ))}
              </div>
              {con.afterPhoto && (
                <SafeImg src={con.afterPhoto} alt="after" className="w-full h-40 object-cover rounded-xl" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
