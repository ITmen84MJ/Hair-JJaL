import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Users, Scissors, TrendingUp } from 'lucide-react';
import { Client, Consultation, Designer, ServiceType } from '../../../types';
import { SERVICE_LABELS } from '../../Consultations/serviceLabels';

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };
const COLORS = ['#f43f5e', '#fb923c', '#facc15', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];

export type PeriodKey = 'this_month' | 'last_month' | '3months' | '6months' | 'all';
export const PERIOD_OPTIONS: { id: PeriodKey; label: string }[] = [
  { id: 'this_month', label: '이번 달' },
  { id: 'last_month', label: '지난 달' },
  { id: '3months',    label: '3개월' },
  { id: '6months',    label: '6개월' },
  { id: 'all',        label: '전체' },
];

export function getPeriodRange(key: PeriodKey): { start: string; end: string } {
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

interface Props {
  clients: Client[];
  consultations: Consultation[];
  designers: Designer[];
  periodKey: PeriodKey;
  onPeriodChange: (key: PeriodKey) => void;
}

export function AnalyticsTab({ clients, consultations, designers, periodKey, onPeriodChange }: Props) {
  const { start: pStart, end: pEnd } = useMemo(() => getPeriodRange(periodKey), [periodKey]);

  const periodConsultations = useMemo(
    () => consultations.filter(c => c.date >= pStart && c.date <= pEnd),
    [consultations, pStart, pEnd],
  );

  const totalRevenue = consultations.reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);

  const periodRevenue = useMemo(
    () => periodConsultations.reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0),
    [periodConsultations],
  );
  const periodCount = periodConsultations.length;

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const key = format(d, 'yyyy-MM');
    const label = format(d, 'M월', { locale: ko });
    const revenue = consultations
      .filter(c => c.date.startsWith(key))
      .reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);
    return { label, revenue };
  });

  const topServices = useMemo(() => {
    const counts: Partial<Record<ServiceType, number>> = {};
    periodConsultations.forEach(c =>
      c.services.forEach(svc => { counts[svc.type] = (counts[svc.type] ?? 0) + 1; }),
    );
    return (Object.entries(counts) as [ServiceType, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [periodConsultations]);

  const designerRevenue = useMemo(() =>
    designers.map(d => {
      const cons = consultations.filter(c => c.stylistName === d.name);
      const revenue = cons.reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);
      return { ...d, revenue, consultationCount: cons.length };
    }).sort((a, b) => b.revenue - a.revenue),
  [designers, consultations]);

  const pieData = useMemo(
    () => designerRevenue.filter(d => d.revenue > 0).map(d => ({ name: d.name, value: d.revenue })),
    [designerRevenue],
  );

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
    <div className="space-y-5">
      {/* 기간 선택기 */}
      <div className="flex gap-1.5 flex-wrap">
        {PERIOD_OPTIONS.map(({ id, label }) => (
          <button key={id} onClick={() => onPeriodChange(id)}
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
        <div role="img" aria-label={`월별 매출 추이 차트 (최근 6개월): ${monthlyData.map(d => `${d.label} ${d.revenue.toLocaleString()}원`).join(', ')}`}>
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
              <Tooltip
                formatter={(v) => [`${Number(v).toLocaleString()}원`, '매출']}
                contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="revenue" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {pieData.length > 0 && (
        <div className="rounded-2xl border p-5" style={card}>
          <p className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>디자이너별 매출 비중</p>
          <div role="img" aria-label={`디자이너별 매출 비중 차트: ${pieData.map(d => `${d.name} ${Number(d.value).toLocaleString()}원`).join(', ')}`}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="42%" innerRadius={48} outerRadius={76} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${Number(v).toLocaleString()}원`]}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
                <Legend
                  layout="horizontal" verticalAlign="bottom" align="center"
                  iconType="circle" iconSize={8}
                  formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
  );
}
