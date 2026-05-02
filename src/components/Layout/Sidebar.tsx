import React, { useState } from 'react';
import { LayoutDashboard, Users, Sun, Moon, LogOut, Crown, CalendarDays, UserCircle, Smartphone } from 'lucide-react';
import { View, AuthUser, ROLE_LABELS } from '../../types';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Modal } from '../common/Modal';

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
    { id: 'profile',    label: '내 정보',   Icon: UserCircle },
  ],
  owner: [
    { id: 'dashboard',   label: '대시보드',  Icon: LayoutDashboard },
    { id: 'clients',     label: '고객 관리', Icon: Users },
    { id: 'bookings',    label: '예약 관리', Icon: CalendarDays },
    { id: 'owner-staff', label: '직원 관리', Icon: Crown },
    { id: 'profile',     label: '내 정보',   Icon: UserCircle },
  ],
};

const ROLE_BADGE_STYLE: Record<string, React.CSSProperties> = {
  designer: { backgroundColor: 'var(--role-designer-bg)', color: 'var(--role-designer-text)' },
  owner:    { backgroundColor: 'var(--role-owner-bg)',    color: 'var(--role-owner-text)'    },
  customer: { backgroundColor: 'var(--role-customer-bg)', color: 'var(--role-customer-text)' },
};

export function Sidebar({ currentView, onNavigate, isDark, onToggleTheme, user, shopName, onLogout, pendingBookings = 0 }: Props) {
  const items = NAV_ITEMS[user.role] ?? NAV_ITEMS.designer;
  const { canInstall, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

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
          {canInstall && (
            <button onClick={isIOS ? () => setShowIOSGuide(true) : install}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="홈 화면에 추가"
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '')}>
              <Smartphone size={16} />
              홈 화면에 추가
            </button>
          )}
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

      {/* iOS PWA 설치 안내 모달 */}
      {showIOSGuide && (
        <Modal onClose={() => setShowIOSGuide(false)}>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-icon-rose)' }}>
                <Smartphone size={18} style={{ color: 'var(--text-icon-rose)' }} />
              </div>
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>홈 화면에 추가하기</h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Safari에서 아래 단계를 따라 앱처럼 설치하세요.</p>
            <ol className="space-y-3">
              {[
                '하단 툴바의 <b>공유 버튼</b> (□↑)을 탭합니다.',
                '스크롤하여 <b>"홈 화면에 추가"</b>를 선택합니다.',
                '이름을 확인하고 오른쪽 상단 <b>"추가"</b>를 탭합니다.',
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm items-start">
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold mt-0.5">{i + 1}</span>
                  <span style={{ color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: step }} />
                </li>
              ))}
            </ol>
            <button onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold">확인</button>
          </div>
        </Modal>
      )}
    </>
  );
}
