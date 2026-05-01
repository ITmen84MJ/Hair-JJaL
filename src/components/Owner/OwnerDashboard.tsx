import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Users, Scissors, TrendingUp, UserCheck, UserX, Plus, Phone, Mail, CalendarDays, Crown } from 'lucide-react';
import { Client, Consultation, Designer } from '../../types';

interface Props {
  clients: Client[];
  consultations: Consultation[];
  designers: Designer[];
  onAddDesigner: (data: Omit<Designer, 'id'>) => void;
  onUpdateDesigner: (id: string, data: Partial<Designer>) => void;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };
const COLORS = ['#f43f5e', '#fb923c', '#facc15', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];

function AddDesignerModal({ onClose, onAdd }: { onClose: () => void; onAdd: (d: Omit<Designer, 'id'>) => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    onAdd({ ...form, status: 'active', joinedAt: new Date().toISOString().slice(0, 10) });
    onClose();
  };

  const inp = "w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={card}>
        <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>디자이너 추가</h3>
        <form onSubmit={handle} className="space-y-3">
          <input required placeholder="이름 *" value={form.name} onChange={f('name')} className={inp}
            style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
          <input required type="email" placeholder="이메일 *" value={form.email} onChange={f('email')} className={inp}
            style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
          <input placeholder="연락처" value={form.phone} onChange={f('phone')} className={inp}
            style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>취소</button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold">추가</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeaveModal({ designer, onClose, onConfirm }: {
  designer: Designer;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('이직');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={card}>
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
    </div>
  );
}

export function OwnerDashboard({ clients, consultations, designers, onAddDesigner, onUpdateDesigner }: Props) {
  const [tab, setTab] = useState<'stats' | 'staff'>('stats');
  const [showAdd, setShowAdd] = useState(false);
  const [leavingDesigner, setLeavingDesigner] = useState<Designer | null>(null);

  // ── Overall stats ──
  const totalRevenue = consultations.reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthRevenue = consultations
    .filter(c => c.date.startsWith(thisMonth))
    .reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);

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

  // ── Designer revenue breakdown ──
  const designerRevenue = designers.map(d => {
    const cons = consultations.filter(c => c.stylistName === d.name);
    const revenue = cons.reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);
    return { ...d, revenue, consultationCount: cons.length };
  }).sort((a, b) => b.revenue - a.revenue);

  const pieData = designerRevenue.filter(d => d.revenue > 0).map(d => ({ name: d.name, value: d.revenue }));

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
        {([['stats', '전체 통계'], ['staff', '직원 관리']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-rose-500 text-white shadow-sm' : ''}`}
            style={tab !== id ? { color: 'var(--text-secondary)' } : {}}>
            {label}
          </button>
        ))}
      </div>

      {/* ── STATS TAB ── */}
      {tab === 'stats' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statCard('총 매출', `${totalRevenue.toLocaleString()}원`, '누적', TrendingUp, 'bg-rose-500')}
            {statCard('이번달 매출', `${monthRevenue.toLocaleString()}원`, format(new Date(), 'M월', { locale: ko }), TrendingUp, 'bg-amber-500')}
            {statCard('총 고객 수', `${clients.length}명`, '등록', Users, 'bg-blue-500')}
            {statCard('총 시술 수', `${consultations.length}건`, '누적', Scissors, 'bg-emerald-500')}
          </div>

          <div className="rounded-2xl border p-5" style={card}>
            <p className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>월별 매출 추이</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 10000 ? `${(v / 10000).toFixed(0)}만` : `${v}`} />
                <Tooltip formatter={(v) => [`${Number(v).toLocaleString()}원`, '매출']}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {pieData.length > 0 && (
            <div className="rounded-2xl border p-5" style={card}>
              <p className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>디자이너별 매출 비중</p>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${Number(v).toLocaleString()}원`]}
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Legend iconType="circle" iconSize={8}
                      formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
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
                <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
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

      {showAdd && <AddDesignerModal onClose={() => setShowAdd(false)} onAdd={onAddDesigner} />}
      {leavingDesigner && <LeaveModal designer={leavingDesigner} onClose={() => setLeavingDesigner(null)} onConfirm={handleLeave} />}
    </div>
  );
}
