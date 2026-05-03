import { useState } from 'react';
import { Scissors, Calendar, User as UserIcon, Sun, Moon, LogOut, ArrowLeft, Phone, Mail, Edit2, Check, X } from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AuthUser, Client, Consultation, Booking, Shop, View } from '../../types';
import { SERVICE_LABELS } from '../Consultations/serviceLabels';
import { CustomerHome } from './CustomerHome';
import { CustomerConsultationView } from './CustomerConsultationView';

interface Props {
  user: AuthUser;
  client: Client | null;
  consultations: Consultation[];
  bookings: Booking[];
  shop?: Shop | null;
  shops?: Shop[];
  shopName?: string;
  currentView: View;
  selectedConsultationId: string | null;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  onNavigate: (view: View, clientId?: string, consultationId?: string) => void;
  onSelectConsultation: (id: string) => void;
  onNewBooking: () => void;
  onUpdateClient: (id: string, data: Partial<Client>) => void;
  onUpdateConsultation: (id: string, data: Partial<Consultation>) => void;
  onCancelBooking: (id: string) => void;
}

type CustomerTab = 'home' | 'bookings' | 'profile';

const card = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' };

function ProfileEdit({ client, onSave, onCancel }: {
  client: Client;
  onSave: (data: Partial<Client>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    phone: client.phone,
    email: client.email ?? '',
    notes: client.notes ?? '',
  });
  const inp = "w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300";
  return (
    <div className="space-y-3">
      {[
        { label: '전화번호', key: 'phone' },
        { label: '이메일', key: 'email' },
      ].map(({ label, key }) => (
        <div key={key}>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <input
            value={form[key as keyof typeof form]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            className={inp}
            style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />
        </div>
      ))}
      <div>
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>메모 (본인 기록용)</p>
        <textarea
          rows={3}
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          className={`${inp} resize-none`}
          style={{ borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          취소
        </button>
        <button onClick={() => onSave(form)}
          className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold">
          저장
        </button>
      </div>
    </div>
  );
}

const SESSION_TAB_KEY = 'hairjjal_customer_tab';

export function CustomerLayout({
  user, client, consultations, bookings, shop, shops = [], shopName,
  currentView, selectedConsultationId,
  isDark, onToggleTheme, onLogout, onNavigate,
  onSelectConsultation, onNewBooking, onUpdateClient, onUpdateConsultation, onCancelBooking,
}: Props) {
  // P2-14: 탭 선택을 sessionStorage에 유지
  const [tab, setTab] = useState<CustomerTab>(() => {
    const saved = sessionStorage.getItem(SESSION_TAB_KEY);
    return (saved as CustomerTab) ?? 'home';
  });
  const [editingProfile, setEditingProfile] = useState(false);
  // 취소 확인 중인 예약 ID
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const switchTab = (t: CustomerTab) => {
    setTab(t);
    sessionStorage.setItem(SESSION_TAB_KEY, t);
  };

  // P2-18: 대기 중 예약 배지
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  // 상담 상세 진입 시 탭 오버레이
  if (currentView === 'customer-consultation' && selectedConsultationId) {
    const con = consultations.find(c => c.id === selectedConsultationId) ?? null;
    if (con) return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
        <CustomerConsultationView
          consultation={con}
          shops={shops}
          onBack={() => onNavigate('customer-home')}
          onBookNextVisit={date => {
            sessionStorage.setItem('hairjjal_booking_prefill_date', date);
            onNewBooking();
          }}
          onRequestModification={(type, message) =>
            onUpdateConsultation(con.id, {
              modificationRequest: { type, message, requestedAt: new Date().toISOString() },
            })
          }
          onCancelModificationRequest={() =>
            onUpdateConsultation(con.id, { modificationRequest: undefined })
          }
        />
      </div>
    );
  }

  const TAB_ITEMS: { id: CustomerTab; label: string; Icon: React.ElementType }[] = [
    { id: 'home',     label: '시술이력',  Icon: Scissors },
    { id: 'bookings', label: '예약',      Icon: Calendar },
    { id: 'profile',  label: '내 정보',   Icon: UserIcon },
  ];

  const age = client?.birthDate ? differenceInYears(new Date(), parseISO(client.birthDate)) : null;
  const totalSpend = consultations.reduce((s, c) => s + c.services.reduce((ss, svc) => ss + (svc.price ?? 0), 0), 0);

  // ── Bookings tab content ──
  const BookingsTab = () => {
    const active = bookings.filter(b => b.status !== 'cancelled')
      .sort((a, b) => a.requestedDate.localeCompare(b.requestedDate));
    const cancelled = bookings.filter(b => b.status === 'cancelled');

    if (bookings.length === 0) return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Calendar size={40} className="text-rose-200" />
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>예약 내역이 없습니다</p>
        <button onClick={onNewBooking}
          className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-colors">
          예약하기
        </button>
      </div>
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>나의 예약</h2>
          <button onClick={onNewBooking}
            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-rose-500 text-white rounded-xl font-medium">
            + 예약하기
          </button>
        </div>
        {active.map(b => {
          const isPending   = b.status === 'pending';
          const isConfirmed = b.status === 'confirmed';
          const isCancelling = confirmCancelId === b.id;
          // 오늘 이후 예약만 취소 가능
          const today = new Date().toISOString().slice(0, 10);
          const canCancel = b.requestedDate >= today;
          return (
            <div key={b.id} className="rounded-2xl border p-4 space-y-2" style={card}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {format(parseISO(b.requestedDate), 'M월 d일 (EEE)', { locale: ko })} {b.requestedTime}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full border font-medium"
                  style={isConfirmed
                    ? { backgroundColor: 'var(--bg-success)', borderColor: 'var(--border-success)', color: 'var(--text-success)' }
                    : { backgroundColor: 'var(--bg-warning)', borderColor: 'var(--border-warning)', color: 'var(--text-warning)' }}>
                  {isConfirmed ? '확정' : '대기중'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {b.serviceTypes.map(s => (
                  <span key={s} className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                    {SERVICE_LABELS[s] ?? s}
                  </span>
                ))}
              </div>
              {b.preferredDesigner && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>담당: {b.preferredDesigner} 디자이너</p>
              )}
              {b.notes && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.notes}</p>}

              {/* 취소 영역 */}
              {canCancel && (
                isCancelling ? (
                  <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                      예약을 취소하시겠어요? 취소 후에는 되돌릴 수 없습니다.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmCancelId(null)}
                        className="flex-1 py-1.5 rounded-xl border text-xs font-medium"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                        아니요
                      </button>
                      <button
                        onClick={() => { onCancelBooking(b.id); setConfirmCancelId(null); }}
                        className="flex-1 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold">
                        예약 취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                      onClick={() => setConfirmCancelId(b.id)}
                      className="text-xs transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}>
                      예약 취소
                    </button>
                  </div>
                )
              )}
            </div>
          );
        })}
        {cancelled.length > 0 && (
          <details className="group">
            <summary className="text-xs cursor-pointer list-none flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              취소된 예약 {cancelled.length}건 보기 ▾
            </summary>
            <div className="mt-2 space-y-2">
              {cancelled.map(b => (
                <div key={b.id} className="rounded-xl border p-3 opacity-60" style={card}>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {format(parseISO(b.requestedDate), 'M월 d일 (EEE)', { locale: ko })} {b.requestedTime} — 취소됨
                  </p>
                  {b.cancelReason && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{b.cancelReason}</p>}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    );
  };

  // ── Profile tab content ──
  const ProfileTab = () => {
    if (!client) return (
      <div className="text-center py-16">
        <UserIcon size={40} className="mx-auto mb-3 text-rose-200" />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>연결된 고객 정보가 없습니다.</p>
      </div>
    );

    if (editingProfile) return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => setEditingProfile(false)} style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={18} />
          </button>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>정보 수정</h2>
        </div>
        <ProfileEdit
          client={client}
          onSave={data => { onUpdateClient(client.id, data); setEditingProfile(false); }}
          onCancel={() => setEditingProfile(false)}
        />
      </div>
    );

    return (
      <div className="space-y-4">
        {/* Profile card */}
        <div className="rounded-2xl border p-5" style={card}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--bg-icon-rose)' }}>
                <span className="text-2xl font-bold" style={{ color: 'var(--text-icon-rose)' }}>{client.name.charAt(0)}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{client.name}</h2>
                {age !== null && (
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {age}세 · {client.gender === 'female' ? '여성' : client.gender === 'male' ? '남성' : '기타'}
                  </p>
                )}
              </div>
            </div>
            <button onClick={() => setEditingProfile(true)}
              className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
              <Edit2 size={15} />
            </button>
          </div>

          <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
            {client.phone && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                <span>{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Mail size={13} style={{ color: 'var(--text-muted)' }} />
                <span>{client.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border p-4 text-center" style={card}>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{consultations.length}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>총 방문 횟수</p>
          </div>
          <div className="rounded-2xl border p-4 text-center" style={card}>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {totalSpend >= 10000 ? `${Math.floor(totalSpend / 10000)}만원` : `${totalSpend.toLocaleString()}원`}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>누적 이용금액</p>
          </div>
        </div>

        {/* Tags */}
        {client.tags && client.tags.length > 0 && (
          <div className="rounded-2xl border p-4" style={card}>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>헤어 특이사항</p>
            <div className="flex flex-wrap gap-1.5">
              {client.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--bg-tag)', color: 'var(--text-tag)' }}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {client.notes && (
          <div className="rounded-2xl border p-4" style={card}>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>메모</p>
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{client.notes}</p>
          </div>
        )}

        {/* Logout */}
        <div className="rounded-2xl border p-4" style={card}>
          <button onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}>
            <LogOut size={15} /> 로그아웃
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-10 border-b px-5 py-3 flex items-center justify-between"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-rose-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xs">J</span>
          </div>
          <span className="font-bold text-sm truncate max-w-[160px]" style={{ color: 'var(--text-primary)' }}>
            {shopName ?? 'Hair JJaL'}
          </span>
        </div>
        <button onClick={onToggleTheme} className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}>
          {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
        </button>
      </header>

      {/* 본문 */}
      <div className="max-w-lg mx-auto">
        {tab === 'home' && (
          <CustomerHome
            client={client}
            consultations={consultations}
            bookings={bookings}
            shops={shops}
            onSelectConsultation={onSelectConsultation}
            onNewBooking={onNewBooking}
          />
        )}
        {tab === 'bookings' && (
          <div className="p-5">
            <BookingsTab />
          </div>
        )}
        {tab === 'profile' && (
          <div className="p-5">
            <ProfileTab />
          </div>
        )}
      </div>

      {/* 하단 탭 바 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t flex items-stretch"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TAB_ITEMS.map(({ id, label, Icon }) => {
          const active = tab === id;
          const badge = id === 'bookings' && pendingCount > 0 ? pendingCount : 0;
          return (
            <button key={id} onClick={() => switchTab(id)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors relative"
              style={active ? { color: '#f43f5e' } : { color: 'var(--text-muted)' }}>
              <span className="relative">
                <Icon size={20} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {badge}
                  </span>
                )}
              </span>
              <span className="text-[10px]">{label}</span>
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-rose-500" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
