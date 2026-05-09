import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Image, Bookmark, ChevronDown, RotateCcw } from 'lucide-react';
import { Consultation, Service, ServiceType, Designer } from '../../types';
import { SERVICE_LABELS } from './serviceLabels';
import { VoiceNoteButton } from './VoiceNoteButton';
import { inputCls as sharedInputCls } from '../../styles/form';
import { uploadOrCompressPhoto } from '../../utils/imageCompress';
import { useFormulaTemplates } from '../../hooks/useFormulaTemplates';
import { Modal } from '../common/Modal';

interface Props {
  clientId: string;
  clientName: string;
  shopId?: string;              // Supabase Storage 업로드 경로용 (없으면 base64 사용)
  initial?: Partial<Consultation>;
  designers?: Designer[];
  lastConsultation?: Consultation; // P2-22: 이전 방문 컨텍스트
  onSave: (data: Omit<Consultation, 'id' | 'shareToken' | 'createdAt' | 'shopId'>) => void;
  onClose: () => void;
}

const EMPTY_SERVICE: Service = { type: 'cut', description: '', price: undefined };

function PhotoUpload({
  label,
  value,
  onChange,
  shopId,
  clientId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  shopId?: string;
  clientId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // value 가 바뀌면 에러·로드 상태 초기화 (새 업로드 또는 삭제 후)
  useEffect(() => {
    setImgError(false);
    setImgLoaded(false);
  }, [value]);

  // HTTP URL(Storage)은 느린 응답·연결 실패 시 onError가 오래 걸릴 수 있음.
  // 8초 타임아웃 — onLoad가 이미 성공했거나 에러 상태면 타이머 설정 안 함
  useEffect(() => {
    if (!value || imgError || imgLoaded) return;
    if (!value.startsWith('http')) return; // base64는 즉시 렌더링, 타임아웃 불필요
    const tid = setTimeout(() => setImgError(true), 8000);
    return () => clearTimeout(tid);
  }, [value, imgError, imgLoaded]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setImgError(false);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string;
      // 압축 + Storage 업로드 (Supabase 모드) 또는 base64 압축 (localStorage 모드)
      const result = await uploadOrCompressPhoto(raw, shopId ?? '', clientId);
      onChange(result);
      setUploading(false);
      // input 초기화 — 같은 파일 재선택 허용
      if (inputRef.current) inputRef.current.value = '';
    };
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {value ? (
        <div className="relative">
          {imgError ? (
            /* 이미지 로드 실패 시 — 재업로드 또는 삭제 유도 */
            <div className="w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1"
              style={{ borderColor: '#fca5a5', backgroundColor: '#fff1f2', color: '#ef4444' }}>
              <Image size={18} />
              <span className="text-xs text-center px-2">이미지를 불러올 수 없습니다</span>
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => inputRef.current?.click()}
                  className="text-xs px-2.5 py-1 rounded-lg border font-medium"
                  style={{ borderColor: '#fca5a5', color: '#ef4444', backgroundColor: 'white' }}>
                  다시 업로드
                </button>
                <button type="button" onClick={() => { onChange(''); setImgError(false); }}
                  className="text-xs px-2.5 py-1 rounded-lg font-medium text-white"
                  style={{ backgroundColor: '#ef4444' }}>
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <img src={value} alt={label} className="w-full h-32 object-cover rounded-xl"
              onLoad={() => { setImgError(false); setImgLoaded(true); }}
              onError={() => setImgError(true)} />
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            <button type="button" onClick={() => inputRef.current?.click()} aria-label="사진 변경"
              className="p-1.5 rounded-lg shadow transition-colors"
              style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
              <Image size={12} />
            </button>
            <button type="button" onClick={() => { onChange(''); setImgError(false); }} aria-label="사진 삭제"
              className="p-1.5 rounded-lg shadow transition-colors text-red-500"
              style={{ backgroundColor: 'var(--bg-card)' }}>
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full h-24 border-2 border-dashed rounded-xl flex items-center justify-center gap-3 disabled:opacity-60"
          style={{ borderColor: 'var(--border)' }}>
          {uploading ? (
            <div className="flex flex-col items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">업로드 중…</span>
            </div>
          ) : (
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
              className="flex flex-col items-center gap-1.5"
              style={{ color: 'var(--text-muted)' }}>
              <Image size={20} />
              <span className="text-xs">클릭하여 사진 업로드</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AccordionSection({ title, hint, defaultOpen = false, children }: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-colors hover:opacity-80"
        style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-muted)' }}
      >
        <span>{title}</span>
        <div className="flex items-center gap-2">
          {!open && hint && <span className="text-[10px] font-normal truncate max-w-[120px]" style={{ color: 'var(--text-muted)' }}>{hint}</span>}
          <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 space-y-3 border-t" style={{ borderColor: 'var(--border)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function ConsultationForm({ clientId, clientName, shopId, initial, designers, lastConsultation, onSave, onClose }: Props) {
  const [showLastVisit, setShowLastVisit] = useState(false);
  const { templates, addTemplate, removeTemplate } = useFormulaTemplates();
  const [showColorTpl, setShowColorTpl] = useState(false);
  const [showPermTpl,  setShowPermTpl]  = useState(false);
  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);
  const [serviceError, setServiceError] = useState('');
  const isDirty = useRef(false);

  const [form, setForm] = useState({
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    stylistName: initial?.stylistName ?? '',
    services: initial?.services ?? [{ ...EMPTY_SERVICE }] as Service[],
    hairCondition: initial?.hairCondition ?? '',
    scalp: initial?.scalp ?? '',
    colorFormula: initial?.colorFormula ?? '',
    permFormula: initial?.permFormula ?? '',
    beforePhoto: initial?.beforePhoto ?? '',
    afterPhoto: initial?.afterPhoto ?? '',
    notes: initial?.notes ?? '',
    nextVisitDate: initial?.nextVisitDate ?? '',
    nextVisitNote: initial?.nextVisitNote ?? '',
    isShared: initial?.isShared ?? false,
  });

  // ── Q-5: Draft autosave ──────────────────────────────────────────────────
  const DRAFT_KEY = `hairjjal_draft_${clientId}`;
  const [hasDraft, setHasDraft] = useState(() => {
    if (initial) return false; // 수정 모드에서는 드래프트 무시
    try { return !!localStorage.getItem(`hairjjal_draft_${clientId}`); } catch { return false; }
  });

  // 1초 디바운스 자동 저장 (새 상담 전용)
  useEffect(() => {
    if (initial) return;
    const id = setTimeout(() => {
      if (!isDirty.current) return;
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch {}
    }, 1000);
    return () => clearTimeout(id);
  }, [form, DRAFT_KEY, initial]);

  const restoreDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) { setForm(JSON.parse(raw)); isDirty.current = true; }
    } catch {}
    setHasDraft(false);
  }, [DRAFT_KEY]);

  const discardDraft = useCallback(() => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setHasDraft(false);
  }, [DRAFT_KEY]);

  const setField = (key: string, val: unknown) => {
    isDirty.current = true;
    setForm(f => ({ ...f, [key]: val }));
  };

  const updateService = (i: number, key: keyof Service, val: string | number) => {
    setServiceError('');
    const updated = form.services.map((s, idx) =>
      idx === i ? { ...s, [key]: key === 'price' ? (val === '' ? undefined : Number(val)) : val } : s
    );
    setField('services', updated);
  };

  const addService = () => { setServiceError(''); setField('services', [...form.services, { ...EMPTY_SERVICE }]); };
  const removeService = (i: number) => setField('services', form.services.filter((_, idx) => idx !== i));

  // beforeunload 이벤트로 브라우저 닫기/새로고침 방어
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty.current) { e.preventDefault(); }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // 닫기 버튼 처리 — dirty면 확인 모달
  const handleClose = () => {
    if (isDirty.current) { setShowDirtyConfirm(true); }
    else { onClose(); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const filledServices = form.services.filter(s => s.description.trim());
    if (filledServices.length === 0) {
      setServiceError('최소 하나의 시술 항목을 입력해 주세요.');
      return;
    }
    isDirty.current = false;
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    onSave({
      clientId,
      date: form.date,
      stylistName: form.stylistName.trim(),
      services: form.services.filter(s => s.description.trim()),
      hairCondition: form.hairCondition.trim(),
      scalp: form.scalp.trim() || undefined,
      colorFormula: form.colorFormula.trim() || undefined,
      permFormula: form.permFormula.trim() || undefined,
      beforePhoto: form.beforePhoto || undefined,
      afterPhoto: form.afterPhoto || undefined,
      notes: form.notes.trim(),
      nextVisitDate: form.nextVisitDate || undefined,
      nextVisitNote: form.nextVisitNote.trim() || undefined,
      isShared: form.isShared,
    });
  };

  const inputCls = sharedInputCls;

  return (
    <>
    <Modal onClose={handleClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10 rounded-t-2xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{initial ? '상담 수정' : '새 상담 추가'}</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{clientName} 고객</p>
        </div>
        <button onClick={handleClose} aria-label="닫기" style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
      </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          {/* P2-22: 이전 방문 컨텍스트 */}
          {!initial && lastConsultation && (
            <div className="rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-muted)' }}>
              <button
                type="button"
                onClick={() => setShowLastVisit(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span>📋 이전 방문 참조 ({lastConsultation.date})</span>
                <span>{showLastVisit ? '▲' : '▼'}</span>
              </button>
              {showLastVisit && (
                <div className="px-4 pb-3 space-y-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  {lastConsultation.hairCondition && (
                    <div>
                      <p className="text-[10px] font-medium mt-2" style={{ color: 'var(--text-muted)' }}>모발 상태</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{lastConsultation.hairCondition}</p>
                    </div>
                  )}
                  {lastConsultation.colorFormula && (
                    <div>
                      <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>컬러 포뮬러</p>
                      <p className="text-xs font-mono rounded px-2 py-1" style={{ backgroundColor: 'var(--bg-formula)', color: 'var(--text-secondary)' }}>{lastConsultation.colorFormula}</p>
                    </div>
                  )}
                  {lastConsultation.permFormula && (
                    <div>
                      <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>펌 포뮬러</p>
                      <p className="text-xs font-mono rounded px-2 py-1" style={{ backgroundColor: 'var(--bg-formula)', color: 'var(--text-secondary)' }}>{lastConsultation.permFormula}</p>
                    </div>
                  )}
                  {lastConsultation.notes && (
                    <div>
                      <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>메모</p>
                      <p className="text-xs whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{lastConsultation.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Q-5: Draft restore banner */}
          {hasDraft && (
            <div className="flex items-center justify-between rounded-xl px-4 py-2.5"
              style={{ backgroundColor: 'var(--bg-warning)', color: 'var(--text-warning)' }}>
              <div className="flex items-center gap-2">
                <RotateCcw size={13} />
                <span className="text-xs font-medium">저장된 임시 작성 내용이 있습니다</span>
              </div>
              <div className="flex gap-2 ml-3 flex-shrink-0">
                <button type="button" onClick={discardDraft}
                  className="text-xs px-2 py-1 rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--border-warning)', color: 'var(--text-warning)' }}>
                  버리기
                </button>
                <button type="button" onClick={restoreDraft}
                  className="text-xs px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors">
                  복원하기
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>시술 날짜 *</label>
              <input required type="date" value={form.date} onChange={e => setField('date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>담당 스타일리스트 *</label>
              {designers && designers.length > 0 ? (
                <select
                  required
                  value={form.stylistName}
                  onChange={e => setField('stylistName', e.target.value)}
                  className={inputCls}
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-input)' }}
                >
                  <option value="">선택하세요</option>
                  {designers.filter(d => d.status === 'active' || d.name === form.stylistName).map(d => (
                    <option key={d.id} value={d.name}>{d.name}{d.status === 'inactive' ? ' (퇴직)' : ''}</option>
                  ))}
                </select>
              ) : (
                <input required value={form.stylistName} onChange={e => setField('stylistName', e.target.value)} className={inputCls} placeholder="스타일리스트 이름" />
              )}
            </div>
          </div>

          {/* Services */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>시술 항목</label>
              <button type="button" onClick={addService} className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1">
                <Plus size={12} /> 추가
              </button>
            </div>
            <div className="space-y-2">
              {form.services.map((svc, i) => (
                <div key={i} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-2">
                  <select value={svc.type} onChange={e => updateService(i, 'type', e.target.value)}
                    className="border rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300 sm:flex-shrink-0 sm:w-32"
                    style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                    {(Object.keys(SERVICE_LABELS) as ServiceType[]).map(t => (
                      <option key={t} value={t}>{SERVICE_LABELS[t]}</option>
                    ))}
                  </select>
                  <div className="flex gap-1.5 flex-1">
                    <input value={svc.description} onChange={e => updateService(i, 'description', e.target.value)}
                      className={`flex-1 ${inputCls}`} placeholder="시술 설명" />
                    <input type="number" min={0} value={svc.price ?? ''} onChange={e => updateService(i, 'price', e.target.value)}
                      className="w-24 border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                      style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                      placeholder="금액" />
                    {form.services.length > 1 && (
                      <button type="button" onClick={() => removeService(i)} aria-label="시술 항목 삭제"
                        className="hover:text-red-500 py-2 transition-colors flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {serviceError && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ color: 'var(--text-danger)', backgroundColor: 'var(--bg-danger)' }}>{serviceError}</p>
          )}

          {/* Q-4: 모발·두피 상태 (accordion) */}
          <AccordionSection
            title="모발 · 두피 상태"
            hint={[form.hairCondition, form.scalp].filter(Boolean).join(' / ')}
            defaultOpen={!!(form.hairCondition || form.scalp)}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>모발 상태</label>
                  <VoiceNoteButton compact onAppend={text => setField('hairCondition', (form.hairCondition ? form.hairCondition + ' ' : '') + text.trim())} />
                </div>
                <input value={form.hairCondition} onChange={e => setField('hairCondition', e.target.value)} className={inputCls} placeholder="예: 손상 보통, 건조함" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>두피 상태</label>
                  <VoiceNoteButton compact onAppend={text => setField('scalp', (form.scalp ? form.scalp + ' ' : '') + text.trim())} />
                </div>
                <input value={form.scalp} onChange={e => setField('scalp', e.target.value)} className={inputCls} placeholder="예: 지성, 민감" />
              </div>
            </div>
          </AccordionSection>

          {/* Q-4: 시술 포뮬러 (accordion) */}
          <AccordionSection
            title="시술 포뮬러"
            hint={[
              form.colorFormula ? '컬러: ' + form.colorFormula.slice(0, 20) : '',
              form.permFormula  ? '펌: '   + form.permFormula.slice(0, 20)  : '',
            ].filter(Boolean).join(' / ')}
            defaultOpen={!!(form.colorFormula || form.permFormula)}
          >
          <div className="grid grid-cols-2 gap-4">
            {/* 컬러 포뮬러 + 템플릿 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>컬러 포뮬러</label>
                <div className="flex items-center gap-1">
                  <VoiceNoteButton compact onAppend={text => setField('colorFormula', (form.colorFormula ? form.colorFormula + ' ' : '') + text.trim())} />
                  {form.colorFormula.trim() && (
                    <button type="button" title="현재 포뮬러 저장"
                      onClick={() => addTemplate('color', form.colorFormula)}
                      className="text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors"
                      style={{ color: 'var(--text-muted)' }}>
                      <Bookmark size={10} /> 저장
                    </button>
                  )}
                  {templates.color.length > 0 && (
                    <button type="button"
                      onClick={() => setShowColorTpl(v => !v)}
                      className="text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors"
                      style={{ color: 'var(--text-muted)' }}>
                      <ChevronDown size={10} /> 저장됨 {templates.color.length}
                    </button>
                  )}
                </div>
              </div>
              <textarea value={form.colorFormula} onChange={e => setField('colorFormula', e.target.value)} rows={2}
                className={`${inputCls} resize-none`} placeholder="예: Wella 7/0 + 6% (1:1.5)" />
              {showColorTpl && templates.color.length > 0 && (
                <div className="mt-1 p-2 rounded-lg border space-y-1 max-h-32 overflow-y-auto"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-muted)' }}>
                  {templates.color.map((t, i) => (
                    <div key={i} className="flex items-center justify-between gap-1 group">
                      <button type="button"
                        onClick={() => { setField('colorFormula', t); setShowColorTpl(false); }}
                        className="flex-1 text-left text-[11px] truncate hover:text-rose-500 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}>
                        {t}
                      </button>
                      <button type="button" onClick={() => removeTemplate('color', t)} aria-label="컬러 포뮬러 템플릿 삭제"
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity flex-shrink-0">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 펌 포뮬러 + 템플릿 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>펌 포뮬러</label>
                <div className="flex items-center gap-1">
                  <VoiceNoteButton compact onAppend={text => setField('permFormula', (form.permFormula ? form.permFormula + ' ' : '') + text.trim())} />
                  {form.permFormula.trim() && (
                    <button type="button" title="현재 포뮬러 저장"
                      onClick={() => addTemplate('perm', form.permFormula)}
                      className="text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors"
                      style={{ color: 'var(--text-muted)' }}>
                      <Bookmark size={10} /> 저장
                    </button>
                  )}
                  {templates.perm.length > 0 && (
                    <button type="button"
                      onClick={() => setShowPermTpl(v => !v)}
                      className="text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors"
                      style={{ color: 'var(--text-muted)' }}>
                      <ChevronDown size={10} /> 저장됨 {templates.perm.length}
                    </button>
                  )}
                </div>
              </div>
              <textarea value={form.permFormula} onChange={e => setField('permFormula', e.target.value)} rows={2}
                className={`${inputCls} resize-none`} placeholder="예: 1액 15분, 2액 10분" />
              {showPermTpl && templates.perm.length > 0 && (
                <div className="mt-1 p-2 rounded-lg border space-y-1 max-h-32 overflow-y-auto"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-muted)' }}>
                  {templates.perm.map((t, i) => (
                    <div key={i} className="flex items-center justify-between gap-1 group">
                      <button type="button"
                        onClick={() => { setField('permFormula', t); setShowPermTpl(false); }}
                        className="flex-1 text-left text-[11px] truncate hover:text-rose-500 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}>
                        {t}
                      </button>
                      <button type="button" onClick={() => removeTemplate('perm', t)} aria-label="펌 포뮬러 템플릿 삭제"
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity flex-shrink-0">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </AccordionSection>

          {/* Q-4: Before/After 사진 (accordion) — 수정 모드이거나 기존 사진 있을 때 항상 열림 */}
          <AccordionSection
            title="Before / After 사진"
            hint={(form.beforePhoto ? 'Before 있음' : '') + (form.afterPhoto ? (form.beforePhoto ? ' · ' : '') + 'After 있음' : '')}
            defaultOpen={!!initial || !!(form.beforePhoto || form.afterPhoto)}
          >
          <div className="grid grid-cols-2 gap-4">
            <PhotoUpload label="Before 사진" value={form.beforePhoto} onChange={v => setField('beforePhoto', v)} shopId={shopId} clientId={clientId} />
            <PhotoUpload label="After 사진" value={form.afterPhoto} onChange={v => setField('afterPhoto', v)} shopId={shopId} clientId={clientId} />
          </div>
          </AccordionSection>

          {/* Q-4: 메모 + 다음 방문 (accordion) */}
          <AccordionSection
            title="상담 메모 · 다음 방문"
            hint={form.notes ? form.notes.slice(0, 30) + (form.notes.length > 30 ? '…' : '') : form.nextVisitDate ? `다음 방문 ${form.nextVisitDate}` : ''}
            defaultOpen={!!(form.notes || form.nextVisitDate || form.nextVisitNote)}
          >
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>상담 메모</label>
              <VoiceNoteButton onAppend={text => setField('notes', (form.notes ? form.notes + '\n' : '') + text.trim())} />
            </div>
            <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} rows={4}
              className={`${inputCls} resize-none`} placeholder="상담 내용, 고객 요청사항 등 (또는 음성으로 기록)" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>다음 방문 예정일</label>
              <input type="date" value={form.nextVisitDate} onChange={e => setField('nextVisitDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>다음 방문 내용</label>
              <input value={form.nextVisitNote} onChange={e => setField('nextVisitNote', e.target.value)} className={inputCls} placeholder="예: 뿌리 터치업" />
            </div>
          </div>
          </AccordionSection>

          <div className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: 'var(--bg-muted)' }}>
            <input type="checkbox" id="isShared" checked={form.isShared} onChange={e => setField('isShared', e.target.checked)} className="w-4 h-4 rounded text-rose-500" />
            <label htmlFor="isShared" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              고객 공유 링크 활성화
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose}
              className="flex-1 border rounded-lg py-2.5 text-sm font-medium transition-colors"
              style={{ borderColor: 'var(--border-input)', color: 'var(--text-secondary)' }}>
              취소
            </button>
            <button type="submit" className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
              {initial ? '수정 완료' : '상담 저장'}
            </button>
          </div>
        </form>
    </Modal>
    {/* 이탈 확인 다이얼로그 — 메인 폼보다 뒤에 렌더링해야 z-index 없이도 위에 표시됨 */}
    {showDirtyConfirm && (
      <Modal onClose={() => setShowDirtyConfirm(false)}>
        <div className="p-6 space-y-4">
          <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>작성 중인 내용이 있습니다</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>닫으면 입력한 내용이 모두 사라집니다. 그래도 닫으시겠어요?</p>
          <div className="flex gap-2">
            <button onClick={() => setShowDirtyConfirm(false)}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>계속 작성</button>
            <button onClick={() => { isDirty.current = false; try { localStorage.removeItem(DRAFT_KEY); } catch {} onClose(); }}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold">닫기</button>
          </div>
        </div>
      </Modal>
    )}
    </>
  );
}
