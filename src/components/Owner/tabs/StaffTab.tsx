import { useState, useMemo } from 'react';
import { UserX, UserCheck, Plus, Phone, Mail, CalendarDays, Edit2, Check, X, KeyRound } from 'lucide-react';
import { Consultation, Designer, DesignerRole, ServiceType } from '../../../types';
import { Modal } from '../../common/Modal';
import { SERVICE_LABELS } from '../../Consultations/serviceLabels';

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const SVC_OPTIONS: ServiceType[] = ['cut', 'color', 'bleach', 'perm', 'straightening', 'treatment', 'scalp', 'styling', 'other'];

// ── AddDesignerModal ─────────────────────────────────────────────────────────
function AddDesignerModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (d: Omit<Designer, 'id' | 'shopId'>, password: string) => Promise<void> | void;
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return;
    setSubmitting(true);
    await onAdd(
      { name: form.name, email: form.email, phone: form.phone, status: 'active', joinedAt: new Date().toISOString().slice(0, 10) },
      form.password,
    );
    setDone(true);
    setSubmitting(false);
  };

  const inp = 'w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300';
  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4">
        {done ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-icon-green)' }}>
                <Check size={18} style={{ color: 'var(--text-success)' }} />
              </div>
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>디자이너 추가 완료</h3>
            </div>
            <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: 'var(--bg-muted)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>생성된 로그인 계정</p>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>이메일</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{form.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>초기 비밀번호</span>
                <span className="text-sm font-mono font-bold text-rose-500">{form.password}</span>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>위 계정 정보를 디자이너에게 전달해 주세요.</p>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold">확인</button>
          </>
        ) : (
          <>
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>디자이너 추가</h3>
            <form onSubmit={handle} className="space-y-3">
              <input required placeholder="이름 *" value={form.name} onChange={f('name')} className={inp}
                style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              <input required type="email" placeholder="이메일 (로그인 계정) *" value={form.email} onChange={f('email')} className={inp}
                style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              <input placeholder="연락처" value={form.phone} onChange={f('phone')} className={inp}
                style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <KeyRound size={12} style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>초기 비밀번호 (디자이너에게 전달)</p>
                </div>
                <input required placeholder="초기 비밀번호 *" value={form.password} onChange={f('password')} className={inp}
                  style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>취소</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white text-sm font-semibold">
                  {submitting ? '처리 중...' : '추가'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── LeaveModal ───────────────────────────────────────────────────────────────
function LeaveModal({ designer, onClose, onConfirm }: {
  designer: Designer;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('이직');
  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4">
        <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{designer.name} 퇴직 처리</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          퇴직 처리 시 해당 디자이너는 비활성화됩니다. 기존 시술 이력은 보존됩니다.
        </p>
        <div>
          <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>퇴직 사유</p>
          <div className="flex gap-2">
            {['이직', '퇴사', '기타'].map(r => (
              <button key={r} onClick={() => setReason(r)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${reason === r ? 'bg-rose-500 text-white border-rose-500' : ''}`}
                style={reason !== r ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>취소</button>
          <button onClick={() => onConfirm(reason)}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold">퇴직 처리</button>
        </div>
      </div>
    </Modal>
  );
}

// ── DesignerEditModal ────────────────────────────────────────────────────────
function DesignerEditModal({ designer, onClose, onSave }: {
  designer: Designer;
  onClose: () => void;
  onSave: (data: Partial<Designer>) => void;
}) {
  const [name, setName] = useState(designer.name);
  const [email, setEmail] = useState(designer.email);
  const [phone, setPhone] = useState(designer.phone ?? '');
  const [role, setRole] = useState<DesignerRole>(designer.role ?? 'staff');
  const [bio, setBio] = useState(designer.bio ?? '');
  const [specialties, setSpecialties] = useState<ServiceType[]>(designer.specialties ?? []);
  const [workDays, setWorkDays] = useState<number[]>(designer.workDays ?? [0, 1, 2, 3, 4, 5, 6]);
  const [dayOff, setDayOff] = useState<string[]>(designer.dayOff ?? []);
  const [newDayOff, setNewDayOff] = useState('');

  const toggleSpecialty = (s: ServiceType) =>
    setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleWorkDay = (d: number) =>
    setWorkDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b));
  const addDayOff = () => {
    if (newDayOff && !dayOff.includes(newDayOff)) {
      setDayOff(prev => [...prev, newDayOff].sort());
      setNewDayOff('');
    }
  };

  const inp = 'w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300';
  const inpStyle = { borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' };
  const sectionLabel = 'text-xs font-semibold uppercase tracking-wide mb-2 block';

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
        <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{designer.name} 정보 수정</h3>

        <div className="space-y-2.5">
          <span className={sectionLabel} style={{ color: 'var(--text-muted)' }}>기본 정보</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="이름 *" className={inp} style={inpStyle} />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일 *" className={inp} style={inpStyle} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="연락처" className={inp} style={inpStyle} />
        </div>

        <div>
          <span className={sectionLabel} style={{ color: 'var(--text-muted)' }}>권한</span>
          <div className="flex gap-2">
            {(['staff', 'manager'] as DesignerRole[]).map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${role === r ? 'bg-rose-500 text-white border-rose-500' : ''}`}
                style={role !== r ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}>
                {r === 'staff' ? '스태프' : '매니저'}
              </button>
            ))}
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>매니저는 전체 디자이너 매출을 열람할 수 있습니다.</p>
        </div>

        <div>
          <span className={sectionLabel} style={{ color: 'var(--text-muted)' }}>한 줄 소개</span>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2}
            placeholder="고객에게 보여질 짧은 소개를 입력하세요."
            className={`${inp} resize-none`} style={inpStyle} />
        </div>

        <div>
          <span className={sectionLabel} style={{ color: 'var(--text-muted)' }}>전문 시술</span>
          <div className="flex flex-wrap gap-2">
            {SVC_OPTIONS.map(s => (
              <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${specialties.includes(s) ? 'bg-rose-500 text-white border-rose-500' : ''}`}
                style={!specialties.includes(s) ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}>
                {SERVICE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className={sectionLabel} style={{ color: 'var(--text-muted)' }}>근무 요일</span>
          <div className="flex gap-1.5">
            {DAY_LABELS.map((label, idx) => (
              <button key={idx} type="button" onClick={() => toggleWorkDay(idx)}
                aria-label={`${label}요일 ${workDays.includes(idx) ? '근무' : '휴무'}`}
                className={`w-9 h-9 rounded-full text-xs font-bold border transition-colors ${workDays.includes(idx) ? 'bg-rose-500 text-white border-rose-500' : ''}`}
                style={!workDays.includes(idx) ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className={sectionLabel} style={{ color: 'var(--text-muted)' }}>특정 휴무일</span>
          <div className="flex gap-2 mb-2">
            <input type="date" value={newDayOff} onChange={e => setNewDayOff(e.target.value)}
              className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              style={inpStyle} />
            <button type="button" onClick={addDayOff}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium">추가</button>
          </div>
          {dayOff.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {dayOff.map(d => (
                <span key={d} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                  style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                  {d}
                  <button type="button" onClick={() => setDayOff(prev => prev.filter(x => x !== d))}
                    aria-label={`${d} 삭제`} style={{ color: 'var(--text-muted)' }}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>취소</button>
          <button type="button" disabled={!name.trim()}
            onClick={() => {
              onSave({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, role, bio: bio.trim() || undefined, specialties: specialties.length ? specialties : undefined, workDays, dayOff });
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white text-sm font-semibold">저장</button>
        </div>
      </div>
    </Modal>
  );
}

// ── StaffTab (main export) ───────────────────────────────────────────────────
interface Props {
  designers: Designer[];
  consultations: Consultation[];
  onAddDesigner: (data: Omit<Designer, 'id' | 'shopId'>, password: string) => Promise<void> | void;
  onUpdateDesigner: (id: string, data: Partial<Designer>) => void;
}

export function StaffTab({ designers, consultations, onAddDesigner, onUpdateDesigner }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [leavingDesigner, setLeavingDesigner] = useState<Designer | null>(null);
  const [editingDesigner, setEditingDesigner] = useState<Designer | null>(null);

  const designerRevenue = useMemo(() =>
    designers.map(d => {
      const cons = consultations.filter(c => c.stylistName === d.name);
      const revenue = cons.reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);
      return { ...d, revenue, consultationCount: cons.length };
    }).sort((a, b) => b.revenue - a.revenue),
  [designers, consultations]);

  const handleLeave = (reason: string) => {
    if (!leavingDesigner) return;
    onUpdateDesigner(leavingDesigner.id, {
      status: 'inactive',
      leftAt: new Date().toISOString().slice(0, 10),
      leftReason: reason,
    });
    setLeavingDesigner(null);
  };

  const handleReactivate = (id: string) => {
    onUpdateDesigner(id, { status: 'active', leftAt: undefined, leftReason: undefined });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          재직 {designers.filter(d => d.status === 'active').length}명 · 퇴직 {designers.filter(d => d.status === 'inactive').length}명
        </p>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus size={14} /> 디자이너 추가
        </button>
      </div>

      <div className="space-y-3">
        {designerRevenue.map(d => (
          <div key={d.id} className="rounded-2xl border p-4" style={{ ...card, opacity: d.status === 'inactive' ? 0.7 : 1 }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                  style={d.status === 'active'
                    ? { backgroundColor: 'var(--bg-icon-rose)', color: 'var(--text-icon-rose)' }
                    : { backgroundColor: 'var(--bg-neutral)', color: 'var(--text-neutral)' }}>
                  {d.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate max-w-[120px]" style={{ color: 'var(--text-primary)' }}>{d.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={d.status === 'active'
                        ? { backgroundColor: 'var(--bg-success)', color: 'var(--text-success)' }
                        : { backgroundColor: 'var(--bg-neutral)', color: 'var(--text-neutral)' }}>
                      {d.status === 'active' ? '재직' : `퇴직 (${d.leftReason ?? ''})`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {d.email && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Mail size={11} /> {d.email}
                      </span>
                    )}
                    {d.phone && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Phone size={11} /> {d.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <CalendarDays size={11} /> 입사 {d.joinedAt}
                    </span>
                    {d.leftAt && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        퇴직 {d.leftAt}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{d.revenue.toLocaleString()}원</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.consultationCount}건</p>
              </div>
            </div>

            {(d.bio || (d.specialties && d.specialties.length > 0)) && (
              <div className="mt-2 pt-2 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
                {d.bio && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.bio}</p>}
                {d.specialties && d.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {d.specialties.map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--bg-icon-rose)', color: 'var(--text-icon-rose)' }}>
                        {SERVICE_LABELS[s]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setEditingDesigner(d)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '')}>
                <Edit2 size={12} /> 정보 수정
              </button>
              {d.status === 'active' ? (
                <button onClick={() => setLeavingDesigner(d)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'var(--bg-danger)'; el.style.borderColor = 'var(--border-danger)'; el.style.color = 'var(--text-danger)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = ''; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-secondary)'; }}>
                  <UserX size={12} /> 퇴직 처리
                </button>
              ) : (
                <button onClick={() => handleReactivate(d.id)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'var(--bg-success)'; el.style.borderColor = 'var(--border-success)'; el.style.color = 'var(--text-success)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = ''; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-secondary)'; }}>
                  <UserCheck size={12} /> 재활성화
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAdd && <AddDesignerModal onClose={() => setShowAdd(false)} onAdd={onAddDesigner} />}
      {leavingDesigner && <LeaveModal designer={leavingDesigner} onClose={() => setLeavingDesigner(null)} onConfirm={handleLeave} />}
      {editingDesigner && (
        <DesignerEditModal
          designer={editingDesigner}
          onClose={() => setEditingDesigner(null)}
          onSave={data => onUpdateDesigner(editingDesigner.id, data)}
        />
      )}
    </div>
  );
}

