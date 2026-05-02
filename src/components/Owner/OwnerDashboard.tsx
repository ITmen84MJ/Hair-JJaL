import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Users, Scissors, TrendingUp, UserCheck, UserX, Plus, Phone, Mail, CalendarDays, Crown, Store, Edit2, Check, X, KeyRound } from 'lucide-react';
import { Client, Consultation, Designer, Shop } from '../../types';
import { Modal } from '../common/Modal';

interface Props {
  shop: Shop | null;
  clients: Client[];
  consultations: Consultation[];
  designers: Designer[];
  onAddDesigner: (data: Omit<Designer, 'id' | 'shopId'>, password: string) => void;
  onUpdateDesigner: (id: string, data: Partial<Designer>) => void;
  onUpdateShop: (data: Partial<Shop>) => void;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };
const COLORS = ['#f43f5e', '#fb923c', '#facc15', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];

function AddDesignerModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (d: Omit<Designer, 'id' | 'shopId'>, password: string) => void;
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '1234' });
  const [done, setDone] = useState(false);
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return;
    onAdd({ name: form.name, email: form.email, phone: form.phone, status: 'active', joinedAt: new Date().toISOString().slice(0, 10) }, form.password);
    setDone(true);
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
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold">추가</button>
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

export function OwnerDashboard({ shop, clients, consultations, designers, onAddDesigner, onUpdateDesigner, onUpdateShop }: Props) {
  const [tab, setTab] = useState<'stats' | 'staff' | 'shop'>('stats');
  const [showAdd, setShowAdd] = useState(false);
  const [leavingDesigner, setLeavingDesigner] = useState<Designer | null>(null);
  const [editingShop, setEditingShop] = useState(false);
  const [shopForm, setShopForm] = useState({
    name: shop?.name ?? '',
    address: shop?.address ?? '',
    phone: shop?.phone ?? '',
    openTime: shop?.openTime ?? '10:00',
    closeTime: shop?.closeTime ?? '19:00',
    slotInterval: String(shop?.slotInterval ?? 30),
  });

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statCard('총 매출', `${totalRevenue.toLocaleString()}원`, '누적', TrendingUp, 'bg-rose-500')}
            {statCard('이번달 매출', `${monthRevenue.toLocaleString()}원`, format(new Date(), 'M월', { locale: ko }), TrendingUp, 'bg-amber-500')}
            {statCard('총 고객 수', `${clients.length}명`, '등록', Users, 'bg-blue-500')}
            {statCard('총 시술 수', `${consultations.length}건`, '누적', Scissors, 'bg-emerald-500')}
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
    </div>
  );
}
