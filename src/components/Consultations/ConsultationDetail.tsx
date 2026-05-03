import { useState } from 'react';
import { ArrowLeft, Share2, Copy, Check, Edit2, Trash2, Calendar, User, FlaskConical, Droplets, Camera, AlertTriangle, Printer } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Client, Consultation } from '../../types';
import { SafeImg } from '../common/SafeImg';
import { SERVICE_LABELS, SERVICE_COLORS } from './serviceLabels';
import { ConsultationForm } from './ConsultationForm';
import { Modal } from '../common/Modal';

interface Props {
  consultation: Consultation;
  client: Client;
  onBack: () => void;
  onUpdate: (id: string, data: Partial<Consultation>) => void;
  onDelete: (id: string) => void;
  onToggleShare: (id: string) => void;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

function DeleteConsultationModal({ isShared, onClose, onConfirm }: {
  isShared: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>상담 이력 삭제</h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>이 상담 이력을 삭제할까요? 삭제 후에는 복구할 수 없습니다.</p>
        {isShared && (
          <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2"
            style={{ backgroundColor: 'var(--bg-warning)', color: 'var(--text-warning)' }}>
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>현재 고객에게 공유 중인 상담입니다. 삭제하면 고객의 공유 링크가 즉시 만료됩니다.</span>
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

export function ConsultationDetail({ consultation, client, onBack, onUpdate, onDelete, onToggleShare }: Props) {
  const [copied, setCopied] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const con = consultation;
  const shareUrl = `${window.location.origin}${window.location.pathname}?share=${con.shareToken}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalPrice = con.services.reduce((s, svc) => s + (svc.price ?? 0), 0);

  return (
    <div className="p-6 space-y-5 max-w-2xl" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="flex items-center gap-3">
        <button onClick={onBack} aria-label="뒤로 가기" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={20} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>상담 상세</h1>
          <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{client.name} 고객</p>
        </div>
        <button onClick={() => window.print()} aria-label="인쇄" className="p-1.5 rounded-lg transition-colors print:hidden" style={{ color: 'var(--text-muted)' }}><Printer size={16} /></button>
        <button onClick={() => setShowEdit(true)} aria-label="상담 수정" className="p-1.5 rounded-lg transition-colors hover:text-rose-500 print:hidden" style={{ color: 'var(--text-muted)' }}><Edit2 size={16} /></button>
        <button onClick={() => setShowDeleteModal(true)} aria-label="상담 삭제" className="p-1.5 rounded-lg transition-colors hover:text-red-500 print:hidden" style={{ color: 'var(--text-muted)' }}><Trash2 size={16} /></button>
      </div>

      {/* 고객이 수정/삭제 요청을 남긴 경우 배너 표시 */}
      {con.modificationRequest && (
        <div className="rounded-2xl border px-4 py-3.5 flex items-start gap-3"
          style={{ backgroundColor: 'var(--bg-warning)', borderColor: 'var(--border-warning)' }}>
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text-warning)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-warning)' }}>
              고객 {con.modificationRequest.type === 'delete' ? '삭제' : '수정'} 요청
            </p>
            {con.modificationRequest.message && (
              <p className="text-xs mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--text-warning)' }}>
                {con.modificationRequest.message}
              </p>
            )}
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {format(parseISO(con.modificationRequest.requestedAt), 'yyyy-MM-dd HH:mm', { locale: ko })} 요청
            </p>
          </div>
          <button
            onClick={() => onUpdate(con.id, { modificationRequest: undefined })}
            className="text-xs px-3 py-1.5 rounded-xl flex-shrink-0 font-medium transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            처리 완료
          </button>
        </div>
      )}

      {/* Date & Services */}
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
          </div>
          <div className="text-right">
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalPrice.toLocaleString()}원</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>총 금액</p>
          </div>
        </div>
        <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>시술 항목</p>
          <div className="space-y-2">
            {con.services.map((svc, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${SERVICE_COLORS[svc.type]}`}>{SERVICE_LABELS[svc.type]}</span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{svc.description}</span>
                </div>
                {svc.price && <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{svc.price.toLocaleString()}원</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {(con.beforePhoto || con.afterPhoto) && (
        <div className="rounded-2xl border p-5" style={card}>
          <div className="flex items-center gap-2 mb-3"><Camera size={14} style={{ color: 'var(--text-muted)' }} /><p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Before / After</p></div>
          <div className="grid grid-cols-2 gap-3">
            {con.beforePhoto && <div><p className="text-xs text-center mb-1.5" style={{ color: 'var(--text-muted)' }}>Before</p><SafeImg src={con.beforePhoto} alt="before" className="w-full aspect-[4/5] object-cover rounded-xl" /></div>}
            {con.afterPhoto && <div><p className="text-xs text-center mb-1.5" style={{ color: 'var(--text-muted)' }}>After</p><SafeImg src={con.afterPhoto} alt="after" className="w-full aspect-[4/5] object-cover rounded-xl" /></div>}
          </div>
        </div>
      )}

      {(con.hairCondition || con.scalp) && (
        <div className="rounded-2xl border p-5 space-y-3" style={card}>
          <div className="flex items-center gap-2 mb-1"><Droplets size={14} style={{ color: 'var(--text-muted)' }} /><p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>모발 / 두피 상태</p></div>
          {con.hairCondition && <div><p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>모발</p><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{con.hairCondition}</p></div>}
          {con.scalp && <div><p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>두피</p><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{con.scalp}</p></div>}
        </div>
      )}

      {(con.colorFormula || con.permFormula) && (
        <div className="rounded-2xl border p-5 space-y-3" style={card}>
          <div className="flex items-center gap-2 mb-1"><FlaskConical size={14} style={{ color: 'var(--text-muted)' }} /><p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>시술 포뮬러</p></div>
          {con.colorFormula && <div><p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>컬러</p><p className="text-sm font-mono rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--bg-formula)', color: 'var(--text-secondary)' }}>{con.colorFormula}</p></div>}
          {con.permFormula && <div><p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>펌</p><p className="text-sm font-mono rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--bg-formula)', color: 'var(--text-secondary)' }}>{con.permFormula}</p></div>}
        </div>
      )}

      {con.notes && (
        <div className="rounded-2xl border p-5" style={card}>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>상담 메모</p>
          <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{con.notes}</p>
        </div>
      )}

      {con.nextVisitDate && (
        <div className="rounded-2xl p-4 border"
          style={{ backgroundColor: 'var(--bg-warning)', borderColor: 'var(--border-warning)' }}>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-warning)' }}>다음 방문 예정</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-warning-2)' }}>{format(parseISO(con.nextVisitDate), 'yyyy년 M월 d일', { locale: ko })}</p>
          {con.nextVisitNote && <p className="text-sm mt-0.5" style={{ color: 'var(--text-warning)' }}>{con.nextVisitNote}</p>}
        </div>
      )}

      {/* Share */}
      <div className="rounded-2xl border p-5" style={card}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Share2 size={14} style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>고객 공유</p>
          </div>
          <button onClick={() => onToggleShare(con.id)}
            aria-label={con.isShared ? '공유 비활성화' : '공유 활성화'}
            aria-pressed={con.isShared}
            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
            style={{ backgroundColor: con.isShared ? '#f43f5e' : 'var(--border-input)' }}>
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${con.isShared ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
        </div>
        {con.isShared ? (
          <div className="space-y-2">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>고객이 아래 링크로 시술 내역을 확인할 수 있습니다.</p>
            <div className="flex gap-2">
              <input readOnly value={shareUrl} className="flex-1 text-xs border rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--bg-muted)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }} />
              <button onClick={copyLink} className="flex items-center gap-1.5 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs rounded-lg transition-colors flex-shrink-0">
                {copied ? <><Check size={12} /> 복사됨</> : <><Copy size={12} /> 복사</>}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>공유를 활성화하면 고객이 링크로 이 내역을 확인할 수 있습니다.</p>
        )}
      </div>

      {showEdit && <ConsultationForm clientId={con.clientId} clientName={client.name} initial={con}
        onSave={data => { onUpdate(con.id, data); setShowEdit(false); }} onClose={() => setShowEdit(false)} />}
      {showDeleteModal && (
        <DeleteConsultationModal
          isShared={con.isShared}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => { onDelete(con.id); onBack(); }}
        />
      )}
    </div>
  );
}
