import { useState } from 'react';
import { ArrowLeft, Calendar, User, Camera, Droplets, MapPin, MessageSquare, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Consultation, Shop } from '../../types';
import { SafeImg } from '../common/SafeImg';
import { SERVICE_LABELS, SERVICE_COLORS } from '../Consultations/serviceLabels';
import { Modal } from '../common/Modal';

interface Props {
  consultation: Consultation;
  shops?: Shop[];
  onBack: () => void;
  onBookNextVisit?: (date: string) => void;
  onRequestModification?: (type: 'edit' | 'delete', message: string) => void;
  onCancelModificationRequest?: () => void;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

export function CustomerConsultationView({
  consultation: con,
  shops = [],
  onBack,
  onBookNextVisit,
  onRequestModification,
  onCancelModificationRequest,
}: Props) {
  const totalPrice = con.services.reduce((s, svc) => s + (svc.price ?? 0), 0);
  const shopName = shops.find(s => s.id === con.shopId)?.name ?? null;

  // 수정/삭제 요청 모달 상태
  const [showReqModal, setShowReqModal] = useState(false);
  const [reqType, setReqType]   = useState<'edit' | 'delete'>('edit');
  const [reqMessage, setReqMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const hasPending = !!con.modificationRequest;

  const handleSubmitRequest = () => {
    if (!onRequestModification) return;
    onRequestModification(reqType, reqMessage.trim());
    setSubmitted(true);
  };

  return (
    <div className="p-5 space-y-4 max-w-lg mx-auto" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="flex items-center gap-3">
        <button onClick={onBack} aria-label="뒤로 가기" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>시술 상세</h1>
      </div>

      {/* Date, stylist, shop */}
      <div className="rounded-2xl border p-5 space-y-4" style={card}>
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Calendar size={13} className="text-rose-400" />
              <span className="font-medium">{format(parseISO(con.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <User size={13} className="text-rose-400" />{con.stylistName} 스타일리스트
            </div>
            {shopName && (
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <MapPin size={11} className="text-rose-300" />{shopName}
              </div>
            )}
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
            {con.afterPhoto  && <div><p className="text-xs text-center mb-1.5" style={{ color: 'var(--text-muted)' }}>After</p><SafeImg src={con.afterPhoto}  alt="after"  className="w-full aspect-[4/5] object-cover rounded-xl" /></div>}
          </div>
        </div>
      )}

      {/* Hair condition */}
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

      {/* Stylist notes */}
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
            <div className="space-y-1">
              <button onClick={() => onBookNextVisit(con.nextVisitDate!)}
                className="text-xs px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors">
                이 날짜로 예약하기
              </button>
              <p className="text-[10px]" style={{ color: 'var(--text-warning)' }}>
                날짜가 자동 선택됩니다. 예약 시간은 직접 선택해 주세요.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 수정/삭제 요청 영역 ── */}
      {onRequestModification && (
        <div className="rounded-2xl border p-4" style={card}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>기록 수정 요청</p>

          {hasPending ? (
            /* 대기 중인 요청 표시 */
            <div className="space-y-2">
              <div className="rounded-xl px-3 py-2.5 flex items-start gap-2"
                style={{ backgroundColor: 'var(--bg-warning)', borderColor: 'var(--border-warning)' }}>
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text-warning)' }} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-warning)' }}>
                    {con.modificationRequest!.type === 'delete' ? '삭제 요청' : '수정 요청'} 접수됨
                  </p>
                  {con.modificationRequest!.message && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-warning)' }}>
                      {con.modificationRequest!.message}
                    </p>
                  )}
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {format(parseISO(con.modificationRequest!.requestedAt), 'M월 d일 HH:mm', { locale: ko })} 요청
                  </p>
                </div>
              </div>
              {onCancelModificationRequest && (
                <button onClick={onCancelModificationRequest}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  요청 취소
                </button>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                기록 내용이 잘못됐거나 삭제를 원하시면 스타일리스트에게 요청할 수 있습니다.
              </p>
              <button onClick={() => { setSubmitted(false); setReqMessage(''); setShowReqModal(true); }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <MessageSquare size={12} /> 수정/삭제 요청
              </button>
            </div>
          )}
        </div>
      )}

      {/* 요청 Modal */}
      {showReqModal && (
        <Modal onClose={() => setShowReqModal(false)}>
          <div className="p-6 space-y-4">
            {submitted ? (
              <>
                <div className="text-center space-y-2 py-2">
                  <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>요청이 전달되었습니다</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {con.stylistName} 스타일리스트가 확인 후 처리합니다.
                  </p>
                </div>
                <button onClick={() => setShowReqModal(false)}
                  className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold">확인</button>
              </>
            ) : (
              <>
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>수정/삭제 요청</h3>

                {/* Request type */}
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>요청 유형</p>
                  <div className="flex gap-2">
                    {(['edit', 'delete'] as const).map(t => (
                      <button key={t} onClick={() => setReqType(t)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${reqType === t ? 'bg-rose-500 text-white border-rose-500' : ''}`}
                        style={reqType !== t ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}>
                        {t === 'edit' ? '내용 수정 요청' : '기록 삭제 요청'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    {reqType === 'edit' ? '수정 요청 내용' : '삭제 사유'} (선택)
                  </p>
                  <textarea rows={3}
                    placeholder={reqType === 'edit'
                      ? '어떤 내용을 수정해야 하는지 알려주세요.'
                      : '삭제를 원하는 이유를 입력해 주세요. (선택)'}
                    value={reqMessage}
                    onChange={e => setReqMessage(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
                    style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>

                {reqType === 'delete' && (
                  <div className="rounded-xl px-3 py-2.5 flex items-start gap-2"
                    style={{ backgroundColor: 'var(--bg-warning)', borderColor: 'var(--border-warning)' }}>
                    <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text-warning)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-warning)' }}>
                      삭제는 스타일리스트가 직접 처리합니다. 삭제 후 복구는 불가합니다.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setShowReqModal(false)}
                    className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>취소</button>
                  <button onClick={handleSubmitRequest}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold">요청 전송</button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
