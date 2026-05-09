import { useState } from 'react';
import { Scissors, User, Palette, Crown, Eye, EyeOff, HelpCircle, Store, ArrowLeft } from 'lucide-react';
import { demoUsers, mockShops } from '../../data/mockData';
import { AuthUser, Shop } from '../../types';

export interface OwnerRegisterData {
  name: string;
  email: string;
  password: string;
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
}

export interface CustomerRegisterData {
  shopId: string;
  name:   string;
  phone:  string;
  email:  string;
  password: string;
}

interface Props {
  onLogin: (email: string, password: string) => Promise<string | null>;
  onLoginAs: (userId: string) => void;
  onRegisterOwner: (data: OwnerRegisterData) => Promise<string | null>;
  onRegisterCustomer?: (data: CustomerRegisterData) => Promise<string | null>;
  onResetPassword?: (email: string, name: string) => Promise<string | null>;
  shops?: Shop[];
}

const roleInfo = {
  customer: { label: '고객',        Icon: User,   color: 'bg-blue-50 text-blue-600 border-blue-200',  desc: '내 시술 이력 확인' },
  designer: { label: '헤어디자이너', Icon: Palette, color: 'bg-rose-50 text-rose-600 border-rose-200',  desc: '고객 관리 · 상담 기록' },
  owner:    { label: '원장',         Icon: Crown,  color: 'bg-amber-50 text-amber-600 border-amber-200', desc: '전체 통계 · 직원 관리' },
} as const;

// ── 원장 회원가입 폼 ───────────────────────────────────────────────
function OwnerRegisterForm({ onBack, onSubmit }: {
  onBack: () => void;
  onSubmit: (data: OwnerRegisterData) => Promise<string | null>;
}) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    shopName: '', shopAddress: '', shopPhone: '',
  });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const inp = "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setLoading(true);
    const err = await onSubmit({
      name:        form.name.trim(),
      email:       form.email.trim(),
      password:    form.password,
      shopName:    form.shopName.trim(),
      shopAddress: form.shopAddress.trim() || undefined,
      shopPhone:   form.shopPhone.trim()   || undefined,
    });
    if (err) { setError(err); setLoading(false); }
    else     { setDone(true); setLoading(false); }
  };

  if (done) {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto">
          <Store size={24} className="text-white" />
        </div>
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>가입 완료!</h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>지점이 생성되었습니다.<br />이메일과 비밀번호로 로그인해 주세요.</p>
        <button onClick={onBack}
          className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-3 text-sm font-semibold transition-colors">
          로그인 화면으로
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-1.5 mb-1">
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
        <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>원장 정보</span>
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
      </div>

      <input required placeholder="이름 *" value={form.name} onChange={f('name')} className={inp}
        style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
      <input required type="email" placeholder="이메일 (로그인 ID) *" value={form.email} onChange={f('email')} className={inp}
        style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />

      <div className="relative">
        <input required type={showPw ? 'text' : 'password'} placeholder="비밀번호 (6자 이상) *"
          value={form.password} onChange={f('password')} className={`${inp} pr-10`}
          style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
        <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}
          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <input required type="password" placeholder="비밀번호 확인 *" value={form.confirmPassword} onChange={f('confirmPassword')} className={inp}
        style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />

      <div className="flex items-center gap-1.5 pt-1">
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
        <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>지점 정보</span>
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
      </div>

      <input required placeholder="지점명 *" value={form.shopName} onChange={f('shopName')} className={inp}
        style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
      <input placeholder="주소 (선택)" value={form.shopAddress} onChange={f('shopAddress')} className={inp}
        style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
      <input placeholder="전화번호 (선택)" value={form.shopPhone} onChange={f('shopPhone')} className={inp}
        style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />

      {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ color: 'var(--text-danger)', backgroundColor: 'var(--bg-danger)' }}>{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-semibold transition-colors shadow-sm shadow-amber-200">
        {loading ? '처리 중...' : '지점 개설 및 가입'}
      </button>
    </form>
  );
}

// ── 고객 회원가입 폼 ───────────────────────────────────────────────
function CustomerRegisterForm({ shops, onBack, onSubmit }: {
  shops: Shop[];
  onBack: () => void;
  onSubmit: (data: CustomerRegisterData) => Promise<string | null>;
}) {
  const [form, setForm] = useState({
    shopId: shops[0]?.id ?? '',
    name: '', phone: '', email: '', password: '', confirmPassword: '',
  });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const inp = "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.'); return;
    }
    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.'); return;
    }
    if (!form.shopId) {
      setError('지점을 선택해 주세요.'); return;
    }
    setLoading(true);
    const err = await onSubmit({
      shopId:   form.shopId,
      name:     form.name.trim(),
      phone:    form.phone.trim(),
      email:    form.email.trim(),
      password: form.password,
    });
    if (err) { setError(err); setLoading(false); }
    else      { setDone(true); setLoading(false); }
  };

  if (done) {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto">
          <User size={24} className="text-white" />
        </div>
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>가입 완료!</h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          이메일과 비밀번호로 로그인해 주세요.
        </p>
        <button onClick={onBack}
          className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold transition-colors">
          로그인 화면으로
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {shops.length > 1 && (
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>방문 지점 *</label>
          <select
            required value={form.shopId} onChange={f('shopId')}
            className={inp}
            style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
          >
            <option value="">지점 선택</option>
            {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
      <input required placeholder="이름 *" value={form.name} onChange={f('name')} className={inp}
        style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
      <input required placeholder="전화번호 * (010-1234-5678)" value={form.phone} onChange={f('phone')} className={inp}
        style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
      <input required type="email" placeholder="이메일 (로그인 ID) *" value={form.email} onChange={f('email')} className={inp}
        style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
      <div className="relative">
        <input required type={showPw ? 'text' : 'password'} placeholder="비밀번호 (6자 이상) *"
          value={form.password} onChange={f('password')} className={`${inp} pr-10`}
          style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
        <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}
          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <input required type="password" placeholder="비밀번호 확인 *" value={form.confirmPassword} onChange={f('confirmPassword')} className={inp}
        style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />

      {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ color: 'var(--text-danger)', backgroundColor: 'var(--bg-danger)' }}>{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-semibold transition-colors shadow-sm shadow-blue-200">
        {loading ? '처리 중...' : '고객 회원가입'}
      </button>
    </form>
  );
}

// ── 메인 LoginPage ─────────────────────────────────────────────────
export function LoginPage({ onLogin, onLoginAs, onRegisterOwner, onRegisterCustomer, onResetPassword, shops = [] }: Props) {
  const [mode, setMode]       = useState<'login' | 'register' | 'customer-register' | 'reset-password' | 'select-role'>('login');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetName, setResetName]   = useState('');
  const [resetSent, setResetSent]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const err = await onLogin(email, password);
    if (err) setError(err);
    setLoading(false);
  };

  const inp = "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all";
  const shopName = (shopId: string) => mockShops.find(s => s.id === shopId)?.name ?? '';
  const byShop: Record<string, AuthUser[]> = {};
  demoUsers.forEach(u => { (byShop[u.shopId] = byShop[u.shopId] || []).push(u); });

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-200">
            <Scissors size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Hair JJaL</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>헤어 상담 이력 관리 서비스</p>
        </div>

        {/* 로그인 / 원장 가입 카드 */}
        <div className="rounded-2xl shadow-xl p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>

          {mode === 'login' ? (
            <>
              <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>로그인</h2>
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
                  <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ color: 'var(--text-danger)', backgroundColor: 'var(--bg-danger)' }}>{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-semibold transition-colors shadow-sm shadow-rose-200">
                  {loading ? '로그인 중...' : '로그인'}
                </button>
                {onResetPassword && (
                  <button type="button" onClick={() => { setResetEmail(email); setMode('reset-password'); setError(''); }}
                    className="w-full text-center text-xs py-1 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}>
                    비밀번호를 잊으셨나요?
                  </button>
                )}
              </form>

              {/* 가입 유도 — 버튼 1개로 통합 */}
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => setMode('select-role')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  계정이 없으신가요? <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>회원가입</span>
                </button>
              </div>
            </>
          ) : mode === 'select-role' ? (
            <>
              <div className="flex items-center gap-2 mb-5">
                <button onClick={() => setMode('login')} aria-label="뒤로 가기" className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                  <ArrowLeft size={18} />
                </button>
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>회원가입</h2>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>해당되는 항목을 선택해 주세요.</p>
              <div className="space-y-3">
                {onRegisterCustomer && (
                  <button onClick={() => setMode('customer-register')}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border text-left transition-all hover:shadow-sm"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#eff6ff' }}>
                      <User size={18} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>고객</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>시술 이력·예약 조회</p>
                    </div>
                  </button>
                )}
                <button onClick={() => setMode('register')}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border text-left transition-all hover:shadow-sm"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fffbeb' }}>
                    <Crown size={18} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>원장</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>신규 지점 개설 · 직원 관리</p>
                  </div>
                </button>
              </div>
            </>
          ) : mode === 'customer-register' && onRegisterCustomer ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setMode('select-role')} aria-label="뒤로 가기" className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                  <ArrowLeft size={18} />
                </button>
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>고객 회원가입</h2>
              </div>
              <CustomerRegisterForm
                shops={shops}
                onBack={() => setMode('select-role')}
                onSubmit={onRegisterCustomer}
              />
            </>
          ) : mode === 'reset-password' && onResetPassword ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => { setMode('login'); setResetSent(false); setResetName(''); setError(''); }} aria-label="뒤로 가기" className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                  <ArrowLeft size={18} />
                </button>
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>비밀번호 재설정</h2>
              </div>
              {resetSent ? (
                <div className="text-center space-y-3 py-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--bg-success)' }}>
                    <span className="text-2xl">✉️</span>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>재설정 이메일을 보냈어요!</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    <strong>{resetEmail}</strong>로 발송된 링크를 클릭하면<br />새 비밀번호를 설정할 수 있습니다.
                  </p>
                  <button onClick={() => { setMode('login'); setResetSent(false); setResetName(''); }}
                    className="w-full mt-2 py-2.5 rounded-xl border text-sm font-medium"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    로그인으로 돌아가기
                  </button>
                </div>
              ) : (
                <form onSubmit={async e => {
                  e.preventDefault();
                  if (!resetEmail.trim() || !resetName.trim()) return;
                  setLoading(true); setError('');
                  const err = await onResetPassword(resetEmail, resetName);
                  setLoading(false);
                  if (err) setError(err);
                  else setResetSent(true);
                }} className="space-y-3">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    가입 시 등록한 이름과 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
                  </p>
                  <input
                    required placeholder="이름 *" value={resetName}
                    onChange={e => { setResetName(e.target.value); setError(''); }}
                    className={inp}
                    style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                  <input
                    type="email" required placeholder="이메일 *" value={resetEmail}
                    onChange={e => { setResetEmail(e.target.value); setError(''); }}
                    className={inp}
                    style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                  {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ color: 'var(--text-danger)', backgroundColor: 'var(--bg-danger)' }}>{error}</p>}
                  <button type="submit" disabled={loading}
                    className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-semibold transition-colors">
                    {loading ? '확인 중...' : '재설정 이메일 보내기'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setMode('select-role')} aria-label="뒤로 가기" className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                  <ArrowLeft size={18} />
                </button>
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>원장 가입 · 지점 개설</h2>
              </div>
              <OwnerRegisterForm
                onBack={() => setMode('select-role')}
                onSubmit={onRegisterOwner}
              />
            </>
          )}
        </div>

        {/* Demo accounts — DEV 환경 전용 */}
        {import.meta.env.DEV && (
          <div className="rounded-2xl shadow-xl p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>데모 계정으로 체험하기</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">DEV ONLY</span>
            </div>
            <div className="space-y-4">
              {Object.entries(byShop).map(([sid, users]) => (
                <div key={sid}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
                    <span className="text-xs font-bold px-2" style={{ color: 'var(--text-muted)' }}>{shopName(sid)}</span>
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
            <div className="mt-4 text-center">
              <button type="button" onClick={() => setShowHint(v => !v)}
                className="inline-flex items-center gap-1 text-xs hover:text-rose-500 transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                <HelpCircle size={12} />
                {showHint ? '비밀번호 힌트 숨기기' : '로그인 비밀번호를 모르시나요?'}
              </button>
              {showHint && (
                <p className="mt-2 text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                  데모 계정 비밀번호는 모두 <span className="font-mono font-semibold">1234</span>입니다.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
