import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import { Client } from '../../types';
import { inputClsSm as cls, inputStyle } from '../../styles/form';
import { Modal } from '../common/Modal';

interface Props {
  initial?: Partial<Client>;
  clients?: Client[];
  onSave: (data: Omit<Client, 'id' | 'createdAt' | 'shopId'>) => void;
  onClose: () => void;
}

const isValidPhone = (p: string) =>
  /^(010|011|016|017|018|019)[-\s]?\d{3,4}[-\s]?\d{4}$/.test(p.replace(/\s/g, '')) || p.length === 0;

export function ClientForm({ initial, clients, onSave, onClose }: Props) {
  const [phoneWarning, setPhoneWarning] = useState('');
  const [nameError, setNameError] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    birthDate: initial?.birthDate ?? '',
    gender: initial?.gender ?? 'female' as Client['gender'],
    notes: initial?.notes ?? '',
    tags: initial?.tags ?? [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);
  const isDirty = useRef(false);

  const set = (key: string, val: string | string[]) => {
    isDirty.current = true;
    setForm(f => ({ ...f, [key]: val }));
  };

  // 브라우저 새로고침·닫기 방어
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty.current) { e.preventDefault(); }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
    setTagInput('');
    // B-4: 태그 추가 후 입력창 포커스 유지 (모바일 키보드 유지)
    setTimeout(() => tagInputRef.current?.focus(), 0);
  }, [tagInput, form.tags]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;

    // 이름 공백 체크
    if (!form.name.trim()) {
      setNameError('이름을 입력해 주세요.');
      return;
    }

    // 형식 오류 시 저장 차단
    if (phoneWarning === 'format') return;

    // 중복 전화번호: submit 시점에도 재확인 후 차단
    if (clients) {
      const p = form.phone.trim();
      const dup = clients.find(c => c.id !== initial?.id && c.phone.replace(/-/g, '') === p.replace(/-/g, ''));
      if (dup) {
        setPhoneWarning(`dup:${dup.name}`);
        return;
      }
    }

    isDirty.current = false;
    onSave({ name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || undefined, birthDate: form.birthDate || undefined, gender: form.gender, notes: form.notes.trim() || undefined, tags: form.tags.length ? form.tags : undefined });
  };

  const handleClose = () => {
    if (isDirty.current) { setShowDirtyConfirm(true); return; }
    onClose();
  };

  const lbl = "block text-xs font-medium mb-1";

  return (
    <>
      <Modal onClose={handleClose} maxWidth="max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{initial ? '고객 정보 수정' : '새 고객 추가'}</h2>
          <button onClick={handleClose} aria-label="닫기" style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={lbl} style={{ color: 'var(--text-secondary)' }}>이름 *</label>
              <input required value={form.name}
                onChange={e => { set('name', e.target.value); setNameError(''); }}
                onBlur={e => { if (!e.target.value.trim()) setNameError('이름을 입력해 주세요.'); }}
                className={cls} style={inputStyle} placeholder="홍길동" />
              {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
            </div>
            <div>
              <label className={lbl} style={{ color: 'var(--text-secondary)' }}>전화번호 *</label>
              <input
                required
                inputMode="tel"
                value={form.phone}
                onChange={e => { set('phone', e.target.value); setPhoneWarning(''); }}
                onBlur={() => {
                  const p = form.phone.trim();
                  if (p && !isValidPhone(p)) {
                    setPhoneWarning('format');
                    return;
                  }
                  if (p && clients) {
                    const dup = clients.find(c => c.id !== initial?.id && c.phone.replace(/-/g, '') === p.replace(/-/g, ''));
                    if (dup) { setPhoneWarning(`dup:${dup.name}`); return; }
                  }
                  setPhoneWarning('');
                }}
                className={cls}
                style={inputStyle}
                placeholder="010-0000-0000"
              />
              {phoneWarning === 'format' && (
                <p className="text-xs text-red-500 mt-1">전화번호 형식을 확인해 주세요. (예: 010-1234-5678)</p>
              )}
              {phoneWarning.startsWith('dup:') && (
                <p className="text-xs mt-1" style={{ color: '#d97706' }}>⚠️ {phoneWarning.slice(4)} 고객과 전화번호가 동일합니다. 중복 등록 여부를 확인해 주세요.</p>
              )}
            </div>
            <div>
              <label className={lbl} style={{ color: 'var(--text-secondary)' }}>성별</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)} className={cls} style={inputStyle}>
                <option value="female">여성</option>
                <option value="male">남성</option>
                <option value="other">기타</option>
              </select>
            </div>
            <div>
              <label className={lbl} style={{ color: 'var(--text-secondary)' }}>이메일</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={cls} style={inputStyle} placeholder="example@email.com" />
            </div>
            <div>
              <label className={lbl} style={{ color: 'var(--text-secondary)' }}>생년월일</label>
              <input type="date" value={form.birthDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => set('birthDate', e.target.value)}
                className={cls} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className={lbl} style={{ color: 'var(--text-secondary)' }}>메모</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className={`${cls} resize-none`} style={inputStyle} placeholder="두피 특이사항, 알레르기 등" />
          </div>
          <div>
            <label className={lbl} style={{ color: 'var(--text-secondary)' }}>태그</label>
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {form.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-tag)', color: 'var(--text-tag)' }}>
                  {tag}<button type="button" onClick={() => set('tags', form.tags.filter(t => t !== tag))} className="hover:text-red-500">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input ref={tagInputRef} value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className={cls} style={inputStyle} placeholder="태그 입력 후 Enter" />
              <button type="button" onClick={addTag} className="px-3 py-2 rounded-lg text-sm transition-colors" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} className="flex-1 border rounded-lg py-2.5 text-sm font-medium transition-colors" style={{ borderColor: 'var(--border-input)', color: 'var(--text-secondary)' }}>취소</button>
            <button
              type="submit"
              disabled={phoneWarning === 'format' || phoneWarning.startsWith('dup:')}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initial ? '수정 완료' : '고객 추가'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 이탈 확인 모달 */}
      {showDirtyConfirm && (
        <Modal onClose={() => setShowDirtyConfirm(false)}>
          <div className="p-6 space-y-4">
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>작성 중인 내용이 있습니다</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>지금 닫으면 입력한 내용이 사라집니다. 닫으시겠어요?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDirtyConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>계속 작성</button>
              <button onClick={() => { setShowDirtyConfirm(false); isDirty.current = false; onClose(); }}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold">닫기</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
