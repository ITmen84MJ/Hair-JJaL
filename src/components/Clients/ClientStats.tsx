import { useMemo } from 'react';
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import { Consultation } from '../../types';
import { SERVICE_LABELS } from '../Consultations/serviceLabels';

interface Props {
  consultations: Consultation[];
}

const COLORS = ['#f43f5e', '#fb7185', '#fbbf24', '#a78bfa', '#34d399', '#60a5fa', '#f97316', '#e879f9'];

export function ClientStats({ consultations }: Props) {
  const now = new Date();

  // Monthly visit count & spend (last 6 months)
  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i);
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const cons = consultations.filter(c => {
        const d = parseISO(c.date);
        return d >= start && d <= end;
      });
      return {
        month: format(month, 'M월', { locale: ko }),
        visits: cons.length,
        spend: cons.reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0),
      };
    });
  }, [consultations]);

  // Service type distribution
  const serviceData = useMemo(() => {
    const counts: Record<string, number> = {};
    consultations.forEach(c => c.services.forEach(svc => {
      counts[svc.type] = (counts[svc.type] ?? 0) + 1;
    }));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ name: SERVICE_LABELS[type as keyof typeof SERVICE_LABELS] ?? type, value: count }));
  }, [consultations]);

  const totalSpend = consultations.reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);
  const avgSpend = consultations.length ? Math.round(totalSpend / consultations.length) : 0;
  const lastVisit = consultations.length
    ? [...consultations].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;

  const statCards = [
    { label: '총 방문 횟수', value: `${consultations.length}회` },
    { label: '총 누적 금액', value: `${totalSpend.toLocaleString()}원` },
    { label: '방문당 평균', value: `${avgSpend.toLocaleString()}원` },
    { label: '마지막 방문', value: lastVisit ? format(parseISO(lastVisit.date), 'yy.MM.dd') : '-' },
  ];

  if (consultations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-600 rounded-xl py-12 text-center text-gray-400 text-sm">
        상담 이력이 없어 통계를 표시할 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Monthly visits bar chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">월별 방문 횟수 (최근 6개월)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'var(--tooltip-bg, #fff)', border: '1px solid #f3f4f6', borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [`${v}회`, '방문']}
            />
            <Bar dataKey="visits" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly spend area chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">월별 매출 추이 (최근 6개월)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={monthlyData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
            <Tooltip
              contentStyle={{ background: 'var(--tooltip-bg, #fff)', border: '1px solid #f3f4f6', borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [`${Number(v).toLocaleString()}원`, '매출']}
            />
            <Area type="monotone" dataKey="spend" stroke="#f43f5e" strokeWidth={2} fill="url(#spendGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Service type pie chart */}
      {serviceData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">시술 종류 분포</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={serviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                dataKey="value" nameKey="name" paddingAngle={3}>
                {serviceData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--tooltip-bg, #fff)', border: '1px solid #f3f4f6', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${v}회`]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
