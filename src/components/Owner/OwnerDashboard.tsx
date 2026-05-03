import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Users, Scissors, TrendingUp, UserCheck, UserX, Plus, Phone, Mail, CalendarDays, Crown, Store, Edit2, Check, X, KeyRound } from 'lucide-react';
import { Client, Consultation, Designer, DesignerRole, Shop, ServiceType } from '../../types';
import { Modal } from '../common/Modal';
import { SERVICE_LABELS } from '../Consultations/serviceLabels';

interface Props {
  shop: Shop | null;
  clients: Client[];
  consultations: Consultation[];
  designers: Designer[];
  onAddDesigner: (data: Omit<Designer, 'id' | 'shopId'>, password: string) => Promise<void> | void;
  onUpdateDesigner: (id: string, data: Partial<Designer>) => void;
  onUpdateShop: (data: Partial<Shop>) => void;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };
const COLORS = ['#f43f5e', '#fb923c', '#facc15', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];

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
    await onAdd({ name: form.name, email: form.email, phone: form.phone, status: 'active', joinedAt: new Date().toISOString().slice(0, 10) }, form.password);
    setDone(true);
    setSubmitting(false);
  };

  const inp = "w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300";
  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4">
        {done ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Check size={18} className="text-emerald-600" />
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

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const SVC_OPTIONS: ServiceType[] = ['cut', 'color', 'bleach', 'perm', 'straightening', 'treatment', 'scalp', 'styling', 'other'];

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

  const inp = "w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300";
  const inpStyle = { borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' };
  const sectionLabel = "text-xs font-semibold uppercase tracking-wide mb-2 block";

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
        <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{designer.name} 정보 수정</h3>

        {/* Basic info */}
        <div className="space-y-2.5">
          <span className={sectionLabel} style={{ color: 'var(--text-muted)' }}>기본 정보</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="이름 *" className={inp} style={inpStyle} />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일 *" className={inp} style={inpStyle} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="연락처" className={inp} style={inpStyle} />
        </div>

        {/* Role */}
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

        {/* Bio */}
        <div>
          <span className={sectionLabel} style={{ color: 'var(--text-muted)' }}>한 줄 소개</span>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2}
            placeholder="고객에게 보여질 짧은 소개를 입력하세요."
            className={`${inp} resize-none`} style={inpStyle} />
        </div>

        {/* Specialties */}
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

        {/* Work days */}
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

        {/* Day off */}
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

// 기간 옵션
type PeriodKey = 'this_month' | 'last_month' | '3months' | '6months' | 'all';
const PERIOD_OPTIONS: { id: PeriodKey; label: string }[] = [
  { id: 'this_month', label: '이번 달' },
  { id: 'last_month', label: '지난 달' },
  { id: '3months',    label: '3개월' },
  { id: '6months',    label: '6개월' },
  { id: 'all',        label: '전체' },
];

function getPeriodRange(key: PeriodKey): { start: string; end: string } {
  const now = new Date();
  if (key === 'this_month') return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
  if (key === 'last_month') {
    const last = subMonths(now, 1);
    return { start: format(startOfMonth(last), 'yyyy-MM-dd'), end: format(endOfMonth(last), 'yyyy-MM-dd') };
  }
  if (key === '3months') return { start: format(subMonths(now, 2), 'yyyy-MM-01'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
  if (key === '6months') return { start: format(subMonths(now, 5), 'yyyy-MM-01'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
  return { start: '2000-01-01', end: '2099-12-31' };
}

export function OwnerDashboard({ shop, clients, consultations, designers, onAddDesigner, onUpdateDesigner, onUpdateShop }: Props) {
  const [tab, setTab] = useState<'stats' | 'staff' | 'shop'>('stats');
  const [showAdd, setShowAdd] = useState(false);
  const [leavingDesigner, setLeavingDesigner] = useState<Designer | null>(null);
  const [editingDesigner, setEditingDesigner] = useState<Designer | null>(null);
  const [editingShop, setEditingShop] = useState(false);
  const [periodKey, setPeriodKey] = useState<PeriodKey>('6months');
  const [shopForm, setShopForm] = useState({
    name: shop?.name ?? '',
    address: shop?.address ?? '',
    phone: shop?.phone ?? '',
    openTime: shop?.openTime ?? '10:00',
    closeTime: shop?.closeTime ?? '19:00',
    slotInterval: String(shop?.slotInterval ?? 30),
  });

  // ── 기간 필터된 시술 목록 ──
  const { start: pStart, end: pEnd } = useMemo(() => getPeriodRange(periodKey), [periodKey]);
  const periodConsultations = useMemo(() =>
    consultations.filter(c => c.date >= pStart && c.date <= pEnd),
    [consultations, pStart, pEnd]
  );

  // ── Overall stats ──
  const totalRevenue = consultations.reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthRevenue = consultations
    .filter(c => c.date.startsWith(thisMonth))
    .reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);

  // 기간별 매출/건수
  const periodRevenue = useMemo(() =>
    periodConsultations.reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0),
    [periodConsultations]
  );
  const periodCount = periodConsultations.length;

  // ── Monthly revenue chart (last 6 months) ──
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const key = format(d, 'yyyy-MM');
    const label = format(d, 'M월', { locale: ko });
    const revenue = consultations
      .filter(c => c.date.startsWith(key))
      .reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);
    return { label, revenue };
  });

  // ── 인기 시술 TOP5 (기간 필터 적용) ──
  const topServices = useMemo(() => {
    const counts: Partial<Record<ServiceType, number>> = {};
    periodConsultations.forEach(c =>
      c.services.forEach(svc => { counts[svc.type] = (counts[svc.type] ?? 0) + 1; })
    );
    return (Object.entries(counts) as [ServiceType, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [periodConsultations]);

  // ── Designer revenue breakdown (useMemo — 렌더마다 재계산 방지) ──
  const designerRevenue = useMemo(() => designers.map(d => {
    const cons = consultations.filter(c => c.stylistName === d.name);
    const revenue = cons.reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);
    return { ...d, revenue, consultationCount: cons.length };
  }).sort((a, b) => b.revenue - a.revenue), [designers, consultations]);

  const pieData = useMemo(
    () => designerRevenue.filter(d => d.revenue > 0).map(d => ({ name: d.name, value: d.revenue })),
    [designerRevenue],
  );

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

  const statCard = (label: string, value: string, sub: string, Icon: React.ElementType, color: string) => (
    <div className="rounded-2xl border p-4" style={card}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={15} className="text-white" />
        </div>
      </div>
      <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center">
          <Crown size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>원장 대시보드</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>전체 매출 및 직원 관리</p>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {([['stats', '전체 통계'], ['staff', '직원 관리'], ['shop', '지점 정보']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-rose-500 text-white shadow-sm' : ''}`}
            style={tab !== id ? { color: 'var(--text-secondary)' } : {}}>
            {label}
          </button>
        ))}
      </div>

      {/* ── STATS TAB ── */}
      {tab === 'stats' && (
        <div className="space-y-5">
          {/* 기간 선택기 */}
          <div className="flex gap-1.5 flex-wrap">
            {PERIOD_OPTIONS.map(({ id, label }) => (
              <button key={id} onClick={() => setPeriodKey(id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  periodKey === id ? 'bg-rose-500 text-white border-rose-500' : ''
                }`}
                style={periodKey !== id ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}>
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statCard('총 매출', `${totalRevenue.toLocaleString()}원`, '누적', TrendingUp, 'bg-rose-500')}
            {statCard('기간 매출', `${periodRevenue.toLocaleString()}원`, PERIOD_OPTIONS.find(p => p.id === periodKey)?.label ?? '', TrendingUp, 'bg-amber-500')}
            {statCard('총 고객 수', `${clients.length}명`, '등록', Users, 'bg-blue-500')}
            {statCard('기간 시술', `${periodCount}건`, PERIOD_OPTIONS.find(p => p.id === periodKey)?.label ?? '', Scissors, 'bg-emerald-500')}
          </div>

          <div className="rounded-2xl border p-5" style={card}>
            <p className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>월별 매출 추이</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barSize={24} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis
                  width={52}
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 10000 ? `${(v / 10000).toFixed(0)}만` : v === 0 ? '0' : `${v}`}
                />
                <Tooltip formatter={(v) => [`${Number(v).toLocaleString()}원`, '매출']}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {pieData.length > 0 && (
            <div className="rounded-2xl border p-5" style={card}>
              <p className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>디자이너별 매출 비중</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="42%" innerRadius={48} outerRadius={76} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${Number(v).toLocaleString()}원`]}
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  <Legend
                    layout="horizontal" verticalAlign="bottom" align="center"
                    iconType="circle" iconSize={8}
                    formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 인기 시술 TOP5 */}
          {topServices.length > 0 && (
            <div className="rounded-2xl border p-5" style={card}>
              <p className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
                인기 시술 TOP {topServices.length}
                <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                  {PERIOD_OPTIONS.find(p => p.id === periodKey)?.label} 기준
                </span>
              </p>
              <div className="space-y-2.5">
                {(() => {
                  const max = topServices[0][1];
                  return topServices.map(([type, cnt], i) => (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-xs font-bold w-4 text-center flex-shrink-0"
                        style={{ color: i === 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                        {i + 1}
                      </span>
                      <span className="text-sm w-20 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                        {SERVICE_LABELS[type]}
                      </span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)' }}>
                        <div className="h-full rounded-full bg-rose-400 transition-all"
                          style={{ width: `${(cnt / max) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold w-8 text-right flex-shrink-0"
                        style={{ color: 'var(--text-secondary)' }}>
                        {cnt}건
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STAFF TAB ── */}
      {tab === 'staff' && (
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
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{d.name}</p>
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
                {/* bio / specialties */}
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
        </div>
      )}

      {/* ── SHOP TAB ── */}
      {tab === 'shop' && shop && (
        <div className="rounded-2xl border p-5 space-y-4" style={card}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store size={16} style={{ color: 'var(--text-muted)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>지점 정보</h3>
            </div>
            {!editingShop ? (
              <button onClick={() => { setShopForm({ name: shop.name, address: shop.address ?? '', phone: shop.phone ?? '', openTime: shop.openTime ?? '10:00', closeTime: shop.closeTime ?? '19:00', slotInterval: String(shop.slotInterval ?? 30) }); setEditingShop(true); }}
                className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                <Edit2 size={15} />
              </button>
            ) : (
              <div className="flex gap-1.5">
                <button onClick={() => { onUpdateShop({ ...shopForm, slotInterval: Number(shopForm.slotInterval) }); setEditingShop(false); }}
                  className="p-1.5 rounded-lg bg-rose-500 text-white"><Check size={14} /></button>
                <button onClick={() => setEditingShop(false)}
                  className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}><X size={14} /></button>
              </div>
            )}
          </div>
          {editingShop ? (
            <div className="space-y-3">
              {([['지점명 *', 'name'], ['주소', 'address'], ['전화번호', 'phone']] as const).map(([label, key]) => (
                <div key={key}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <input
                    value={shopForm[key]}
                    onChange={e => setShopForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                    style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
              ))}
              <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>예약 시간 설정</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>오픈</p>
                    <input type="time" value={shopForm.openTime}
                      onChange={e => setShopForm(f => ({ ...f, openTime: e.target.value }))}
                      className="w-full border rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                      style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>마감</p>
                    <input type="time" value={shopForm.closeTime}
                      onChange={e => setShopForm(f => ({ ...f, closeTime: e.target.value }))}
                      className="w-full border rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                      style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>간격(분)</p>
                    <select value={shopForm.slotInterval}
                      onChange={e => setShopForm(f => ({ ...f, slotInterval: e.target.value }))}
                      className="w-full border rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                      style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                      <option value="30">30분</option>
                      <option value="60">60분</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>지점명</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{shop.name}</p>
              </div>
              {shop.address && (
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>주소</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{shop.address}</p>
                </div>
              )}
              {shop.phone && (
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>전화번호</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{shop.phone}</p>
                </div>
              )}
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>예약 시간</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {shop.openTime ?? '10:00'} ~ {shop.closeTime ?? '19:00'} ({shop.slotInterval ?? 30}분 간격)
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>개점일</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{shop.createdAt.slice(0, 10)}</p>
              </div>
            </div>
          )}
        </div>
      )}

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
