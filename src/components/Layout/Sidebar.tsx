import { LayoutDashboard, Users, Sun, Moon, LogOut, Crown, CalendarDays } from 'lucide-react';
import { View, AuthUser, ROLE_LABELS } from '../../types';

interface Props {
  currentView: View;
  onNavigate: (view: View) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  user: AuthUser;
  onLogout: () => void;
  pendingBookings?: number;
}

const NAV_ITEMS: Record<string, { id: View; label: string; Icon: React.ElementType }[]> = {
  designer: [
    { id: 'dashboard',  label: '대시보드',  Icon: LayoutDashboard },
    { id: 'clients',    label: '고객 관리', Icon: Users },
    { id: 'bookings',   label: '예약 관리', Icon: CalendarDays },
  ],
  owner: [
    { id: 'dashboard',   label: '대시보드',  Icon: LayoutDashboard },
    { id: 'clients',     label: '고객 관리', Icon: Users },
    { id: 'bookings',    label: '예약 관리', Icon: CalendarDays },
    { id: 'owner-staff', label: '직원 관리', Icon: Crown },
  ],
};

const ROLE_BADGE: Record<string, string> = {
  designer: 'bg-rose-50 text-rose-600',
  owner: 'bg-amber-50 text-amber-700',
  customer: 'bg-blue-50 text-blue-600',
};

export function Sidebar({ currentView, onNavigate, isDark, onToggleTheme, user, onLogout, pendingBookings = 0 }: Props) {
  const items = NAV_ITEMS[user.role] ?? NAV_ITEMS.designer;

  const isActive = (view: View) =>
    currentView === view ||
    (view === 'clients' && (currentView === 'client-detail' || currentView === 'consultation-detail'));

  return (
    <aside className="w-60 min-h-screen border-r flex flex-col" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}>
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">J</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-none" style={{ color: 'var(--text-primary)' }}>Hair JJaL</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>헤어 상담 이력 관리</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
            <span className="text-rose-600 font-bold text-sm">{user.name.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${ROLE_BADGE[user.role] ?? ''}`}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(id) ? 'bg-rose-50 text-rose-600' : ''
            }`}
            style={!isActive(id) ? { color: 'var(--text-secondary)' } : {}}
            onMouseEnter={e => { if (!isActive(id)) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
            onMouseLeave={e => { if (!isActive(id)) (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {id === 'bookings' && pendingBookings > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white min-w-[18px] text-center">
                {pendingBookings}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '')}
        >
          {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          {isDark ? '라이트 모드' : '다크 모드'}
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
        >
          <LogOut size={16} />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
