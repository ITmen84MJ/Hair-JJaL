import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Scissors, Calendar, User, FlaskConical, Droplets, Camera, AlertCircle } from 'lucide-react';
import { Client, Consultation } from '../../types';
import { SafeImg } from '../common/SafeImg';
import { SERVICE_LABELS, SERVICE_COLORS } from '../Consultations/serviceLabels';

interface Props {
  consultation: Consultation | null;
  client: Client | null;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

export function ShareView({ consultation, client }: Props) {
  if (!consultation || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-app)' }}>
        <div className="rounded-2xl p-8 max-w-sm w-full text-center border" style={card}>
          <AlertCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>공유 링크를 찾을 수 없습니다</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>링크가 만료되었거나 비활성화된 공유 링크입니다.</p>
        </div>
      </div>
    );
  }

  const con = consultation;
  const totalPrice = con.services.reduce((s, svc) => s + (svc.price ?? 0), 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Header */}
      <div className="border-b" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="max-w-xl mx-auto px-5 py-4 flex items-center gap-2">
          <div className="w-7 h-7 bg-rose-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Scissors size={14} className="text-white" />
          </div>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>HairLog</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5 py-6 space-y-4">
        {/* Client greeting */}
        <div className="text-center py-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>안녕하세요, {client.name} 고객님</p>
          <p className="font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>시술 내역을 확인해보세요 ✨</p>
        </div>

        {/* Date & Stylist */}
        <div className="rounded-2xl border p-5" style={card}>
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Calendar size={14} className="text-rose-400" />
                <span className="font-medium">{format(parseISO(con.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <User size={14} className="text-rose-400" />
                <span>{con.stylistName} 스타일리스트</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-rose-600">{totalPrice.toLocaleString()}원</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>총 금액</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-wrap gap-1.5">
              {con.services.map((svc, i) => (
                <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${SERVICE_COLORS[svc.type]}`}>
                  {SERVICE_LABELS[svc.type]}
                </span>
              ))}
            </div>
            <div className="mt-3 space-y-1.5">
              {con.services.map((svc, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>{svc.description}</span>
                  {svc.price && <span style={{ color: 'var(--text-muted)' }}>{svc.price.toLocaleString()}원</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Before / After */}
        {(con.beforePhoto || con.afterPhoto) && (
          <div className="rounded-2xl border p-5" style={card}>
            <div className="flex items-center gap-2 mb-3">
              <Camera size={14} className="text-rose-400" />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Before / After</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {con.beforePhoto && (
                <div>
                  <p className="text-xs text-center mb-1.5" style={{ color: 'var(--text-muted)' }}>Before</p>
                  <SafeImg src={con.beforePhoto} alt="before" className="w-full aspect-[4/5] object-cover rounded-xl" />
                </div>
              )}
              {con.afterPhoto && (
                <div>
                  <p className="text-xs text-center mb-1.5" style={{ color: 'var(--text-muted)' }}>After</p>
                  <SafeImg src={con.afterPhoto} alt="after" className="w-full aspect-[4/5] object-cover rounded-xl" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hair condition */}
        {(con.hairCondition || con.scalp) && (
          <div className="rounded-2xl border p-5" style={card}>
            <div className="flex items-center gap-2 mb-3">
              <Droplets size={14} className="text-rose-400" />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>모발 · 두피 상태</p>
            </div>
            {con.hairCondition && (
              <div className="mb-2">
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>모발</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{con.hairCondition}</p>
              </div>
            )}
            {con.scalp && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>두피</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{con.scalp}</p>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {con.notes && (
          <div className="rounded-2xl border p-5" style={card}>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>스타일리스트 메모</p>
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{con.notes}</p>
          </div>
        )}

        {/* Color / Perm formula (shown to client too if present) */}
        {(con.colorFormula || con.permFormula) && (
          <div className="rounded-2xl border p-5" style={card}>
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical size={14} className="text-rose-400" />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>시술 포뮬러</p>
            </div>
            {con.colorFormula && (
              <div className="mb-2">
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>컬러</p>
                <p className="text-sm font-mono rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--bg-formula)', color: 'var(--text-secondary)' }}>{con.colorFormula}</p>
              </div>
            )}
            {con.permFormula && (
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>펌</p>
                <p className="text-sm font-mono rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--bg-formula)', color: 'var(--text-secondary)' }}>{con.permFormula}</p>
              </div>
            )}
          </div>
        )}

        {/* Next visit */}
        {con.nextVisitDate && (
          <div className="rounded-2xl p-4 border" style={{ backgroundColor: 'var(--bg-warning)', borderColor: 'var(--border-warning)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-warning)' }}>다음 방문 안내</p>
            <p className="text-base font-bold" style={{ color: 'var(--text-warning-2)' }}>
              {format(parseISO(con.nextVisitDate), 'yyyy년 M월 d일', { locale: ko })}
            </p>
            {con.nextVisitNote && <p className="text-sm mt-0.5" style={{ color: 'var(--text-warning)' }}>{con.nextVisitNote}</p>}
          </div>
        )}

        <p className="text-center text-xs pb-4" style={{ color: 'var(--text-muted)' }}>Powered by HairLog</p>
      </div>
    </div>
  );
}
