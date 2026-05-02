import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Client } from '../../types';
import { inputClsSm as cls, inputStyle } from '../../styles/form';
import { Modal } from '../common/Modal';

interface Props {
  initial?: Partial<Client>;
  onSave: (data: Omit<Client, 'id' | 'createdAt' | 'shopId'>) => void;
  onClose: () => void;
}

export function ClientForm({ initial, onSave, onClose }: Props) {
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
  const set = (key: string, val: string | string[]) => setForm(f => ({ ...f, [key]: val }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
    setTagInput('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    onSave({ name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || undefined, birthDate: form.birthDate || undefined, gender: form.gender, notes: form.notes.trim() || undefined, tags: form.tags.length ? form.tags : undefined });
  };

  const lbl = "block text-xs font-medium mb-1";

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{initial ? '고객 정보 수정' : '새 고객 추가'}</h2>
        <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
      </div>
      <form onSubmit={submit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={lbl} style={{ color: 'var(--text-secondary)' }}>이름 *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)} className={cls} style={inputStyle} placeholder="홍길동" />
          </div>
          <div>
            <label className={lbl} style={{ color: 'var(--text-secondary)' }}>전화번호 *</label>
            <input required value={form.phone} onChange={e => set('phone', e.target.value)} className={cls} style={inputStyle} placeholder="010-0000-0000" />
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
            <input type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} className={cls} style={inputStyle} />
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
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className={cls} style={inputStyle} placeholder="태그 입력 후 Enter" />
            <button type="button" onClick={addTag} className="px-3 py-2 rounded-lg text-sm transition-colors" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
              <Plus size={14} />
            </button>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2.5 text-sm font-medium transition-colors" style={{ borderColor: 'var(--border-input)', color: 'var(--text-secondary)' }}>취소</button>
          <button type="submit" className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">{initial ? '수정 완료' : '고객 추가'}</button>
        </div>
      </form>
    </Modal>
  );
}
