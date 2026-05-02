import { ArrowLeft, Calendar, User, Camera, Droplets } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Consultation } from '../../types';
import { SafeImg } from '../common/SafeImg';
import { SERVICE_LABELS, SERVICE_COLORS } from '../Consultations/serviceLabels';

interface Props {
  consultation: Consultation;
  onBack: () => void;
  onBookNextVisit?: (date: string) => void;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

export function CustomerConsultationView({ consultation: con, onBack, onBookNextVisit }: Props) {
  const totalPrice = con.services.reduce((s, svc) => s + (svc.price ?? 0), 0);

  return (
    <div className="p-5 space-y-4 max-w-lg mx-auto" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="flex items-center gap-3">
        <button onClick={onBack} style={{ color: 'var(--text-muted)' }}><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>시술 상세</h1>
      </div>

      {/* Date & services */}
      <div className="rounded-2xl border p-5 space-y-4" style={card}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Calendar size={13} className="text-rose-400" />
              <span className="font-medium">{format(parseISO(con.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <User size={13} className="text-rose-400" />{con.stylistName} 스타일리스트
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalPrice.toLocaleString()}원</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>총 금액</p>
          </div>
        </div>
        <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {con.services.map((svc, i) => (
              <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${SERVICE_COLORS[svc.type]}`}>
                {SERVICE_LABELS[svc.type]}
              </span>
            ))}
          </div>
          <div className="space-y-1">
            {con.services.map((svc, i) => (
              <div key={i} className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span>{svc.description}</span>
                {svc.price && <span>{svc.price.toLocaleString()}원</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Before / After */}
      {(con.beforePhoto || con.afterPhoto) && (
        <div className="rounded-2xl border p-5" style={card}>
          <div className="flex items-center gap-2 mb-3">
            <Camera size={14} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Before / After</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {con.beforePhoto && <div><p className="text-xs text-center mb-1.5" style={{ color: 'var(--text-muted)' }}>Before</p><SafeImg src={con.beforePhoto} alt="before" className="w-full aspect-[4/5] object-cover rounded-xl" /></div>}
            {con.afterPhoto && <div><p className="text-xs text-center mb-1.5" style={{ color: 'var(--text-muted)' }}>After</p><SafeImg src={con.afterPhoto} alt="after" className="w-full aspect-[4/5] object-cover rounded-xl" /></div>}
          </div>
        </div>
      )}

      {/* Hair condition — show to customer */}
      {(con.hairCondition || con.scalp) && (
        <div className="rounded-2xl border p-5" style={card}>
          <div className="flex items-center gap-2 mb-3">
            <Droplets size={14} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>모발 · 두피 상태</p>
          </div>
          {con.hairCondition && <div className="mb-2"><p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>모발</p><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{con.hairCondition}</p></div>}
          {con.scalp && <div><p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>두피</p><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{con.scalp}</p></div>}
        </div>
      )}

      {/* Notes — show simplified version */}
      {con.notes && (
        <div className="rounded-2xl border p-5" style={card}>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>스타일리스트 메모</p>
          <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{con.notes}</p>
        </div>
      )}

      {/* Next visit */}
      {con.nextVisitDate && (
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: 'var(--bg-warning)', borderColor: 'var(--border-warning)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-warning)' }}>다음 방문 권장일</p>
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-warning-2)' }}>
            {format(parseISO(con.nextVisitDate), 'yyyy년 M월 d일', { locale: ko })}
          </p>
          {con.nextVisitNote && <p className="text-sm mb-2" style={{ color: 'var(--text-warning)' }}>{con.nextVisitNote}</p>}
          {onBookNextVisit && con.nextVisitDate >= new Date().toISOString().slice(0, 10) && (
            <button
              onClick={() => onBookNextVisit(con.nextVisitDate!)}
              className="text-xs px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors">
              이 날짜로 예약하기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
