import React from 'react';
import { LayoutDashboard, Users, Sun, Moon, LogOut, Crown, CalendarDays } from 'lucide-react';
import { View, AuthUser, ROLE_LABELS } from '../../types';

interface Props {
  currentView: View;
  onNavigate: (view: View) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  user: AuthUser;
  shopName?: string;
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

const ROLE_BADGE_STYLE: Record<string, React.CSSProperties> = {
  designer: { backgroundColor: 'var(--role-designer-bg)', color: 'var(--role-designer-text)' },
  owner:    { backgroundColor: 'var(--role-owner-bg)',    color: 'var(--role-owner-text)'    },
  customer: { backgroundColor: 'var(--role-customer-bg)', color: 'var(--role-customer-text)' },
};

export function Sidebar({ currentView, onNavigate, isDark, onToggleTheme, user, shopName, onLogout, pendingBookings = 0 }: Props) {
  const items = NAV_ITEMS[user.role] ?? NAV_ITEMS.designer;

  const isActive = (view: View) =>
    currentView === view ||
    (view === 'clients' && (currentView === 'client-detail' || currentView === 'consultation-detail'));

  return (
    <>
      {/* ── 데스크탑 사이드바 (md 이상) ── */}
      <aside className="hidden md:flex w-60 min-h-screen border-r flex-col flex-shrink-0"
        style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}>

        {/* Logo */}
        <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-sm">J</span>
            </div>
            <div>
              <p className="font-bold text-sm leading-none" style={{ color: 'var(--text-primary)' }}>
                {shopName ?? 'Hair JJaL'}
              </p>
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
              <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                style={ROLE_BADGE_STYLE[user.role] ?? {}}>
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => onNavigate(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={isActive(id)
                ? { backgroundColor: 'var(--nav-active-bg)', color: 'var(--role-designer-text)' }
                : { color: 'var(--text-secondary)' }}
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
          <button onClick={onToggleTheme}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '')}>
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            {isDark ? '라이트 모드' : '다크 모드'}
          </button>
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}>
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </aside>

      {/* ── 모바일 하단 탭 바 (md 미만) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex items-stretch"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {items.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => onNavigate(id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors relative ${isActive(id) ? 'text-rose-500' : ''}`}
            style={!isActive(id) ? { color: 'var(--text-muted)' } : {}}>
            <div className="relative">
              <Icon size={20} />
              {id === 'bookings' && pendingBookings > 0 && (
                <span className="absolute -top-1.5 -right-2 text-[10px] font-bold w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center">
                  {pendingBookings}
                </span>
              )}
            </div>
            <span className="text-[10px]">{label}</span>
            {isActive(id) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-rose-500" />
            )}
          </button>
        ))}
        {/* 다크모드 + 로그아웃 */}
        <button onClick={onToggleTheme}
          className="flex-none flex flex-col items-center justify-center px-3 py-2 gap-0.5 text-xs transition-colors"
          style={{ color: 'var(--text-muted)' }}>
          {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
          <span className="text-[10px]">{isDark ? '라이트' : '다크'}</span>
        </button>
        <button onClick={onLogout}
          className="flex-none flex flex-col items-center justify-center px-3 py-2 gap-0.5 text-xs transition-colors"
          style={{ color: 'var(--text-muted)' }}>
          <LogOut size={20} />
          <span className="text-[10px]">로그아웃</span>
        </button>
      </nav>
    </>
  );
}
