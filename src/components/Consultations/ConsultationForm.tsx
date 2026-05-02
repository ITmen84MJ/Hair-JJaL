import { useState, useRef } from 'react';
import { X, Plus, Trash2, Upload, Image, Bookmark, ChevronDown } from 'lucide-react';
import { Consultation, Service, ServiceType, Designer } from '../../types';
import { SERVICE_LABELS } from './serviceLabels';
import { VoiceNoteButton } from './VoiceNoteButton';
import { inputCls as sharedInputCls } from '../../styles/form';
import { compressImage } from '../../utils/imageCompress';
import { useFormulaTemplates } from '../../hooks/useFormulaTemplates';

interface Props {
  clientId: string;
  clientName: string;
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string;
      // 이미지 압축: 최대 1280px, JPEG 80% 품질
      const compressed = await compressImage(raw);
      onChange(compressed);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {value ? (
        <div className="relative">
          <img src={value} alt={label} className="w-full h-32 object-cover rounded-xl"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          <div className="absolute top-2 right-2 flex gap-1">
            <button type="button" onClick={() => inputRef.current?.click()}
              className="bg-white/80 dark:bg-gray-800/80 p-1.5 rounded-lg shadow text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors">
              <Upload size={12} />
            </button>
            <button type="button" onClick={() => onChange('')}
              className="bg-white/80 dark:bg-gray-800/80 p-1.5 rounded-lg shadow text-red-500 hover:bg-white dark:hover:bg-gray-700 transition-colors">
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="w-full h-24 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-400 dark:text-gray-500 hover:border-rose-300 dark:hover:border-rose-600 hover:text-rose-400 transition-colors">
          <Image size={20} />
          <span className="text-xs">클릭하여 사진 업로드</span>
        </button>
      )}
    </div>
  );
}

export function ConsultationForm({ clientId, clientName, initial, designers, lastConsultation, onSave, onClose }: Props) {
  const [showLastVisit, setShowLastVisit] = useState(false);
  const { templates, addTemplate, removeTemplate } = useFormulaTemplates();
  const [showColorTpl, setShowColorTpl] = useState(false);
  const [showPermTpl,  setShowPermTpl]  = useState(false);

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

  const setField = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  const updateService = (i: number, key: keyof Service, val: string | number) => {
    const updated = form.services.map((s, idx) =>
      idx === i ? { ...s, [key]: key === 'price' ? (val === '' ? undefined : Number(val)) : val } : s
    );
    setField('services', updated);
  };

  const addService = () => setField('services', [...form.services, { ...EMPTY_SERVICE }]);
  const removeService = (i: number) => setField('services', form.services.filter((_, idx) => idx !== i));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{initial ? '상담 수정' : '새 상담 추가'}</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{clientName} 고객</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">시술 날짜 *</label>
              <input required type="date" value={form.date} onChange={e => setField('date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">담당 스타일리스트 *</label>
              {designers && designers.length > 0 ? (
                <select
                  required
                  value={form.stylistName}
                  onChange={e => setField('stylistName', e.target.value)}
                  className={inputCls}
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-input)' }}
                >
                  <option value="">선택하세요</option>
                  {designers.filter(d => d.status === 'active').map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
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
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">시술 항목</label>
              <button type="button" onClick={addService} className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1">
                <Plus size={12} /> 추가
              </button>
            </div>
            <div className="space-y-2">
              {form.services.map((svc, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <select value={svc.type} onChange={e => updateService(i, 'type', e.target.value)}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-300 flex-shrink-0 w-32">
                    {(Object.keys(SERVICE_LABELS) as ServiceType[]).map(t => (
                      <option key={t} value={t}>{SERVICE_LABELS[t]}</option>
                    ))}
                  </select>
                  <input value={svc.description} onChange={e => updateService(i, 'description', e.target.value)}
                    className={`flex-1 ${inputCls}`} placeholder="시술 설명" />
                  <input type="number" value={svc.price ?? ''} onChange={e => updateService(i, 'price', e.target.value)}
                    className="w-28 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-300"
                    placeholder="금액" />
                  {form.services.length > 1 && (
                    <button type="button" onClick={() => removeService(i)} className="text-gray-300 hover:text-red-500 pt-2">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">모발 상태</label>
              <input value={form.hairCondition} onChange={e => setField('hairCondition', e.target.value)} className={inputCls} placeholder="예: 손상 보통, 건조함" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">두피 상태</label>
              <input value={form.scalp} onChange={e => setField('scalp', e.target.value)} className={inputCls} placeholder="예: 지성, 민감" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 컬러 포뮬러 + 템플릿 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">컬러 포뮬러</label>
                <div className="flex items-center gap-1">
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
                      <button type="button" onClick={() => removeTemplate('color', t)}
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
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">펌 포뮬러</label>
                <div className="flex items-center gap-1">
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
                      <button type="button" onClick={() => removeTemplate('perm', t)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity flex-shrink-0">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Photo Upload */}
          <div className="grid grid-cols-2 gap-4">
            <PhotoUpload label="Before 사진" value={form.beforePhoto} onChange={v => setField('beforePhoto', v)} />
            <PhotoUpload label="After 사진" value={form.afterPhoto} onChange={v => setField('afterPhoto', v)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">상담 메모</label>
              <VoiceNoteButton onAppend={text => setField('notes', (form.notes ? form.notes + '\n' : '') + text.trim())} />
            </div>
            <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} rows={4}
              className={`${inputCls} resize-none`} placeholder="상담 내용, 고객 요청사항 등 (또는 음성으로 기록)" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">다음 방문 예정일</label>
              <input type="date" value={form.nextVisitDate} onChange={e => setField('nextVisitDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">다음 방문 내용</label>
              <input value={form.nextVisitNote} onChange={e => setField('nextVisitNote', e.target.value)} className={inputCls} placeholder="예: 뿌리 터치업" />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-3">
            <input type="checkbox" id="isShared" checked={form.isShared} onChange={e => setField('isShared', e.target.checked)} className="w-4 h-4 rounded text-rose-500" />
            <label htmlFor="isShared" className="text-sm text-gray-700 dark:text-gray-300">
              고객 공유 링크 활성화
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              취소
            </button>
            <button type="submit" className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
              {initial ? '수정 완료' : '상담 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
