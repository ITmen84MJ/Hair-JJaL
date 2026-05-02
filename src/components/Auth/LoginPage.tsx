import { useState } from 'react';
import { Scissors, User, Palette, Crown, Eye, EyeOff } from 'lucide-react';
import { demoUsers, mockShops } from '../../data/mockData';
import { AuthUser } from '../../types';

interface Props {
  onLogin: (email: string, password: string) => string | null;
  onLoginAs: (userId: string) => void;
}

const roleInfo = {
  customer: { label: '고객', Icon: User, color: 'bg-blue-50 text-blue-600 border-blue-200', desc: '내 시술 이력 확인' },
  designer: { label: '헤어디자이너', Icon: Palette, color: 'bg-rose-50 text-rose-600 border-rose-200', desc: '고객 관리 · 상담 기록' },
  owner: { label: '원장', Icon: Crown, color: 'bg-amber-50 text-amber-600 border-amber-200', desc: '전체 통계 · 직원 관리' },
} as const;

export function LoginPage({ onLogin, onLoginAs }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const err = onLogin(email, password);
      if (err) setError(err);
      setLoading(false);
    }, 400);
  };

  const inp = "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all";

  const shopName = (shopId: string) => mockShops.find(s => s.id === shopId)?.name ?? '';

  // Group by shop first, then by role within each shop
  const byShop: Record<string, AuthUser[]> = {};
  demoUsers.forEach(u => { (byShop[u.shopId] = byShop[u.shopId] || []).push(u); });

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #fef9f0 50%, #fff 100%)' }}>
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-200">
            <Scissors size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Hair JJaL</h1>
          <p className="text-gray-500 mt-1 text-sm">헤어 상담 이력 관리 서비스</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-2xl shadow-xl shadow-rose-100/50 p-6 border border-rose-50">
          <h2 className="font-semibold text-gray-800 mb-4">로그인</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email" required placeholder="이메일" value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              className={inp}
              style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            />
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} required placeholder="비밀번호" value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className={`${inp} pr-10`}
                style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-semibold transition-colors shadow-sm shadow-rose-200">
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="bg-white rounded-2xl shadow-xl shadow-rose-100/50 p-6 border border-rose-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">데모 계정으로 체험하기</p>
          <div className="space-y-4">
            {Object.entries(byShop).map(([sid, users]) => (
              <div key={sid}>
                {/* 지점 구분 헤더 */}
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
                  <span className="text-xs font-bold px-2" style={{ color: 'var(--text-muted)' }}>
                    {shopName(sid)}
                  </span>
                  <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
                </div>
                <div className="space-y-1.5">
                  {users.map(u => {
                    const { label, Icon, color, desc } = roleInfo[u.role as keyof typeof roleInfo];
                    return (
                      <button key={u.id} onClick={() => onLoginAs(u.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left hover:shadow-sm transition-all group"
                        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = '#fda4af')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${color.split(' ')[0]} ${color.split(' ')[1]}`}>
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            <span className={`inline-flex items-center gap-0.5 mr-1.5 ${color.split(' ')[1]}`}>
                              <Icon size={9} /> {label}
                            </span>
                            · {desc}
                          </p>
                        </div>
                        <span className="text-xs text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">입장 →</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>모든 데모 계정 비밀번호: <span className="font-mono font-semibold">1234</span></p>
        </div>
      </div>
    </div>
  );
}
