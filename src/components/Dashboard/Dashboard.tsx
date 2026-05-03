import { Users, Scissors, Calendar, TrendingUp, ChevronRight, Clock, Inbox, CalendarCheck } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Client, Consultation, Booking, View } from '../../types';
import { SERVICE_LABELS } from '../Consultations/serviceLabels';

interface Props {
  clients: Client[];
  consultations: Consultation[];
  bookings: Booking[];
  /** 설정 시 해당 디자이너의 예약만 필터해 "오늘의 예약" 표시 */
  designerName?: string;
  onNavigate: (view: View, clientId?: string, consultationId?: string) => void;
}

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

export function Dashboard({ clients, consultations, bookings, designerName, onNavigate }: Props) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = consultations.filter(c => parseISO(c.date) >= monthStart);
  const recentCons = [...consultations].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const upcoming = consultations
    .filter(c => c.nextVisitDate && isAfter(parseISO(c.nextVisitDate), now))
    .sort((a, b) => (a.nextVisitDate ?? '').localeCompare(b.nextVisitDate ?? ''))
    .slice(0, 3);
  const totalRevenue = thisMonth.reduce((sum, c) => sum + c.services.reduce((s, svc) => s + (svc.price ?? 0), 0), 0);

  // 오늘의 예약 — confirmed·pending만, 시간 순 정렬
  const todayBookings = bookings
    .filter(b =>
      b.requestedDate === todayStr &&
      (b.status === 'confirmed' || b.status === 'pending') &&
      (!designerName || !b.preferredDesigner || b.preferredDesigner === designerName)
    )
    .sort((a, b) => (a.requestedTime ?? '').localeCompare(b.requestedTime ?? ''));

  const stats = [
    { label: '전체 고객', value: clients.length, Icon: Users, iconStyle: { backgroundColor: 'var(--bg-icon-blue)', color: 'var(--text-icon-blue)' } },
    { label: '이번 달 시술', value: thisMonth.length, Icon: Scissors, iconStyle: { backgroundColor: 'var(--bg-icon-rose)', color: 'var(--text-icon-rose)' } },
    { label: '이번 달 매출', value: `${totalRevenue.toLocaleString()}원`, Icon: TrendingUp, iconStyle: { backgroundColor: 'var(--bg-icon-amber)', color: 'var(--text-icon-amber)' } },
    { label: '예약 예정', value: upcoming.length, Icon: Calendar, iconStyle: { backgroundColor: 'var(--bg-icon-green)', color: 'var(--text-icon-green)' } },
  ];

  const getClient = (id: string) => clients.find(c => c.id === id);

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>대시보드</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {format(now, 'yyyy년 M월 d일 EEEE', { locale: ko })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, Icon, iconStyle }) => (
          <div key={label} className="rounded-xl p-4 border" style={card}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={iconStyle}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* 오늘의 예약 */}
      {todayBookings.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={card}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--divider)' }}>
            <div className="flex items-center gap-2">
              <CalendarCheck size={16} className="text-rose-500" />
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>오늘의 예약</h2>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">{todayBookings.length}</span>
            </div>
            <button onClick={() => onNavigate('bookings')} className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-0.5">
              전체보기 <ChevronRight size={13} />
            </button>
          </div>
          <div>
            {todayBookings.map(b => {
              const client = clients.find(c => c.id === b.clientId);
              return (
                <div key={b.id} className="flex items-center gap-3 px-5 py-3 border-b last:border-0"
                  style={{ borderColor: 'var(--divider)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--bg-icon-rose)' }}>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-icon-rose)' }}>
                      {client?.name.charAt(0) ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {client?.name ?? '알 수 없음'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {b.preferredDesigner ?? '담당 미정'}{b.notes ? ` · ${b.notes}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{b.requestedTime ?? '-'}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {b.status === 'confirmed' ? '확정' : '대기'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent */}
        <div className="rounded-xl border overflow-hidden" style={card}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--divider)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>최근 상담 이력</h2>
            <button onClick={() => onNavigate('clients')} className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-0.5">
              전체보기 <ChevronRight size={13} />
            </button>
          </div>
          <div>
            {recentCons.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Inbox size={28} className="opacity-30" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>상담 이력이 없습니다.</p>
              </div>
            )}
            {recentCons.map(con => {
              const client = getClient(con.clientId);
              return (
                <button key={con.id} onClick={() => onNavigate('consultation-detail', con.clientId, con.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 transition-colors text-left border-b last:border-0"
                  style={{ borderColor: 'var(--divider)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '')}>
                  <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-rose-600">{client?.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{client?.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{con.services.map(s => SERVICE_LABELS[s.type]).join(' · ')}</p>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{format(parseISO(con.date), 'M/d')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upcoming */}
        <div className="rounded-xl border overflow-hidden" style={card}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--divider)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>다음 방문 예정</h2>
          </div>
          <div>
            {upcoming.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Calendar size={28} className="opacity-30" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>예정된 방문이 없습니다.</p>
              </div>
            )}
            {upcoming.map(con => {
              const client = getClient(con.clientId);
              const daysLeft = Math.ceil((parseISO(con.nextVisitDate!).getTime() - now.getTime()) / 86400000);
              return (
                <button key={con.id} onClick={() => onNavigate('client-detail', con.clientId)}
                  className="w-full flex items-center gap-3 px-5 py-3 transition-colors text-left border-b last:border-0"
                  style={{ borderColor: 'var(--divider)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '')}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-icon-amber)' }}>
                    <Clock size={16} style={{ color: 'var(--text-icon-amber)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{client?.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{con.nextVisitNote}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-amber-500">{daysLeft}일 후</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(parseISO(con.nextVisitDate!), 'M/d')}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
