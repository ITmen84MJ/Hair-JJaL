import { useEffect, useState, lazy, Suspense } from 'react';
import { useStore } from './hooks/useStore';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { USE_SUPABASE } from './lib/supabase';
import { ToastContainer } from './components/common/ToastContainer';
import { Sidebar } from './components/Layout/Sidebar';
import { ShareView } from './components/Share/ShareView';
import { LoginPage, type OwnerRegisterData } from './components/Auth/LoginPage';
import { OnboardingTour } from './components/common/OnboardingTour';
import { SkeletonList } from './components/common/Skeleton';
import { usePWAUpdate } from './hooks/usePWAUpdate';

// 라우트별 lazy 분리 — 초기 번들 최소화
const Dashboard        = lazy(() => import('./components/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const OwnerDashboard   = lazy(() => import('./components/Owner/OwnerDashboard').then(m => ({ default: m.OwnerDashboard })));
const ClientList       = lazy(() => import('./components/Clients/ClientList').then(m => ({ default: m.ClientList })));
const ClientDetail     = lazy(() => import('./components/Clients/ClientDetail').then(m => ({ default: m.ClientDetail })));
const ConsultationDetail = lazy(() => import('./components/Consultations/ConsultationDetail').then(m => ({ default: m.ConsultationDetail })));
const BookingList      = lazy(() => import('./components/Bookings/BookingList').then(m => ({ default: m.BookingList })));
const StaffProfile     = lazy(() => import('./components/Staff/StaffProfile').then(m => ({ default: m.StaffProfile })));
const CustomerLayout   = lazy(() => import('./components/Customer/CustomerLayout').then(m => ({ default: m.CustomerLayout })));
const CustomerBooking  = lazy(() => import('./components/Customer/CustomerBooking').then(m => ({ default: m.CustomerBooking })));

export default function App() {
  const store = useStore();
  const { isDark, toggle } = useTheme();
  const { user, login, loginAs, logout, addDesignerAccount, addOwnerAccount, addCustomerAccount, updateName, updateExtraUser, resetPassword, changePassword, disableDesignerAccount } = useAuth();
  const { needsUpdate, applyUpdate, dismiss } = usePWAUpdate();

  // Share link — always accessible without login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('share');
    if (token) store.navigate('share', undefined, undefined, token);
  }, []);

  // ── 세션 만료 15분 전 경고 (localStorage 모드만) ──
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  useEffect(() => {
    if (USE_SUPABASE || !user?.loginAt) return;
    const expiresAt = new Date(user.loginAt).getTime() + 8 * 60 * 60 * 1000;
    const warnAt = expiresAt - 15 * 60 * 1000;
    const delay = warnAt - Date.now();
    if (delay <= 0) return; // 이미 경고 시간 지남
    const tid = setTimeout(() => setShowExpiryWarning(true), delay);
    return () => clearTimeout(tid);
  }, [user?.loginAt]);

  // ── Share view (public) ──
  if (store.currentView === 'share') {
    const con = store.consultations.find(c => c.shareToken === store.shareToken && c.isShared) ?? null;
    const client = con ? store.clients.find(c => c.id === con.clientId) ?? null : null;
    return <ErrorBoundary><ShareView consultation={con} client={client} /></ErrorBoundary>;
  }

  // ── Not logged in ──
  if (!user) {
    const registerOwner = async (data: OwnerRegisterData): Promise<string | null> => {
      // 1. 지점 생성
      const shop = await store.addShop({
        name:    data.shopName,
        address: data.shopAddress,
        phone:   data.shopPhone,
      });
      // 2. 원장을 디자이너로 등록 (1인샵 포함 — 원장도 헤어디자이너)
      const designer = await store.addDesigner({
        shopId:   shop.id,
        name:     data.name,
        email:    data.email,
        status:   'active',
        joinedAt: new Date().toISOString().slice(0, 10),
      });
      // 3. 원장 계정 생성 (shopId + designerId 연결)
      const err = await addOwnerAccount({
        shopId:     shop.id,
        name:       data.name,
        email:      data.email,
        password:   data.password,
        designerId: designer.id,
      });
      if (err) {
        // 계정 생성 실패 시 생성된 지점도 롤백할 수 없으므로
        // 사용자에게 에러 반환 (지점은 다음 가입 시도 때 중복 생성될 수 있으나
        // 이메일 중복 체크가 먼저 실패하므로 실질적으로 orphan 지점은 드물게 발생)
        return err;
      }
      // 가입 즉시 자동 로그인
      await login(data.email, data.password);
      return null;
    };

    return (
      <ErrorBoundary>
        <LoginPage
          onLogin={login}
          onLoginAs={loginAs}
          onRegisterOwner={registerOwner}
          onRegisterCustomer={async (data) => {
            // 1. 고객 레코드를 store에 먼저 생성 (clientId 확보)
            const client = await store.addClient({
              shopId:    data.shopId,
              name:      data.name,
              phone:     data.phone,
              email:     data.email,
              gender:    'other' as const,
              tags:      [],
              notes:     '',
            });
            // 2. 인증 계정 생성 (clientId 전달)
            const err = await addCustomerAccount({ ...data, clientId: client.id });
            if (err) {
              // 계정 생성 실패 시 방금 만든 client 레코드 롤백
              await store.deleteClient(client.id);
              return err;
            }
            // 가입 즉시 자동 로그인
            await login(data.email, data.password);
            return null;
          }}
          onResetPassword={resetPassword}
          shops={store.shops}
        />
      </ErrorBoundary>
    );
  }

  // ── 온보딩 투어 (첫 로그인 시 1회) ──
  // rendered at z-[70] so it appears above everything

  // ── 현재 로그인 사용자의 "소속 지점" (예약 기본값·지점 정보 표시용) ──
  const shopId = user.shopId;
  const myShop = store.shops.find(s => s.id === shopId) ?? null;

  // ── CUSTOMER view ──
  // 고객은 어느 지점이든 방문 가능 → 전 지점 시술·예약 이력 통합 조회
  if (user.role === 'customer') {
    const myClient = user.clientId
      ? store.clients.find(c => c.id === user.clientId) ?? null   // 지점 필터 없음
      : null;
    // 전 지점 시술 이력 통합 (고객 소유)
    const myConsultations = myClient
      ? store.consultations.filter(c => c.clientId === myClient.id)
      : [];
    // 전 지점 예약 통합
    const myBookings = myClient
      ? store.bookings.filter(b => b.clientId === myClient.id)
      : [];

    const fallback = <div className="flex items-center justify-center min-h-screen text-sm" style={{ color: 'var(--text-muted)' }}>로딩중…</div>;

    // Booking form
    if (store.currentView === 'customer-booking' && myClient) {
      return (
        <ErrorBoundary>
        <Suspense fallback={fallback}>
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
          <CustomerBooking
            client={myClient}
            shops={store.shops}
            allDesigners={store.designers}
            allBookings={store.bookings}
            defaultShopId={shopId}
            onSubmit={async data => {
              await store.addBooking(data);
              store.navigate('customer-home');
            }}
            onBack={() => store.navigate('customer-home')}
          />
        </div>
        </Suspense>
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary>
      {showExpiryWarning && !USE_SUPABASE && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, backgroundColor: '#f59e0b', color: 'white', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 500 }}>
          <span>⏰ 세션이 15분 후 만료됩니다. 계속 사용하려면 다시 로그인해 주세요.</span>
          <button onClick={() => setShowExpiryWarning(false)} style={{ marginLeft: 16, background: 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 6, padding: '3px 10px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>닫기</button>
        </div>
      )}
      <OnboardingTour role={user.role} />
      <Suspense fallback={fallback}>
      <CustomerLayout
        user={user}
        client={myClient}
        consultations={myConsultations}
        bookings={myBookings}
        shop={myShop}
        shopName={myShop?.name}
        shops={store.shops}
        currentView={store.currentView}
        selectedConsultationId={store.selectedConsultationId}
        isDark={isDark}
        onToggleTheme={toggle}
        onLogout={logout}
        onNavigate={store.navigate}
        onSelectConsultation={id => store.navigate('customer-consultation', undefined, id)}
        onNewBooking={() => store.navigate('customer-booking')}
        onUpdateClient={(id, data) => store.updateClient(id, data)}
        onUpdateConsultation={store.updateConsultation}
        onCancelBooking={id => store.updateBooking(id, { status: 'cancelled', cancelReason: '고객 취소' })}
        onRescheduleBooking={(id, date, time) => store.updateBooking(id, { requestedDate: date, requestedTime: time, status: 'pending' })}
        onChangePassword={changePassword}
      />
      </Suspense>
      </ErrorBoundary>
    );
  }

  // ── DESIGNER / OWNER layout with Sidebar ──
  const isDesigner = user.role === 'designer';

  // 지점별 기본 데이터 (owner 통계·관리용, 예약은 venue 기반)
  const shopConsultations = store.consultations.filter(c => c.shopId === shopId);
  const shopDesigners     = store.designers.filter(d => d.shopId === shopId);
  const shopBookings      = store.bookings.filter(b => b.shopId === shopId);

  // 본인 Designer 레코드 (designerId로 직접 연결)
  const myDesignerRecord = user.designerId
    ? shopDesigners.find(d => d.id === user.designerId) ?? null
    : null;

  // ── 3-2 권한 세분화: manager role 디자이너는 지점 전체 데이터 열람 가능 ──
  const isManager = isDesigner && myDesignerRecord?.role === 'manager';

  // ── 디자이너(staff): 이직해도 본인이 시술한 전 지점 이력 보유 ──
  // ── 디자이너(manager): 지점 전체 시술 이력 열람 ──
  // ── 원장: 해당 지점(venue)에서 이뤄진 시술만 관리 ──
  const visibleConsultations = isDesigner && user.designerName && !isManager
    ? store.consultations.filter(c => c.stylistName === user.designerName)  // 지점 무관 본인 시술
    : shopConsultations;  // manager·owner: venue 기준

  // 디자이너(staff)가 볼 수 있는 고객:
  //   1) 본인이 시술한 고객 (전 지점 포함)
  //   2) 현재 지점에 등록된 신규 고객 (아직 시술 기록 없음)
  const designerClientIds = new Set(visibleConsultations.map(c => c.clientId));
  const clientsWithAnyConsultation = new Set(store.consultations.map(c => c.clientId));

  // 원장·manager가 볼 수 있는 고객: 해당 지점에서 시술받은 고객
  const shopConsultationClientIds = new Set(shopConsultations.map(c => c.clientId));
  const shopClients = store.clients.filter(c =>
    shopConsultationClientIds.has(c.id) || c.shopId === shopId
  );

  const visibleClients = isDesigner && !isManager
    ? store.clients.filter(c =>
        designerClientIds.has(c.id) ||
        (c.shopId === shopId && !clientsWithAnyConsultation.has(c.id))
      )
    : shopClients;

  const selectedClient = store.selectedClientId
    ? visibleClients.find(c => c.id === store.selectedClientId) ?? null
    : null;

  const selectedConsultation = store.selectedConsultationId
    ? shopConsultations.find(c => c.id === store.selectedConsultationId) ?? null
    : null;

  // 선택된 고객의 시술 이력 — 디자이너(staff)는 본인 것만, manager·원장은 지점 전체
  const clientConsultations = selectedClient
    ? visibleConsultations.filter(c => c.clientId === selectedClient.id)
    : [];

  // Pending booking count for sidebar badge
  const pendingBookings = isDesigner && !isManager && user.designerName
    ? shopBookings.filter(b => b.status === 'pending' && (!b.preferredDesigner || b.preferredDesigner === user.designerName)).length
    : shopBookings.filter(b => b.status === 'pending').length;

  // 본인 담당 시술 이력 — 이직 전 지점 포함 전체 (지점 무관)
  const myOwnConsultations = user.designerName
    ? store.consultations.filter(c => c.stylistName === user.designerName)
    : [];

  // 모바일 상단 헤더용 뷰 제목
  const VIEW_TITLES: Partial<Record<typeof store.currentView, string>> = {
    dashboard: '대시보드', clients: '고객 관리', bookings: '예약 관리',
    'owner-staff': '직원 관리', profile: '내 정보',
  };
  const mobileTitle = VIEW_TITLES[store.currentView];

  return (
    <ErrorBoundary>
    {showExpiryWarning && !USE_SUPABASE && (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, backgroundColor: '#f59e0b', color: 'white', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 500 }}>
        <span>⏰ 세션이 15분 후 만료됩니다. 계속 사용하려면 다시 로그인해 주세요.</span>
        <button onClick={() => setShowExpiryWarning(false)} style={{ marginLeft: 16, background: 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 6, padding: '3px 10px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>닫기</button>
      </div>
    )}
    <OnboardingTour role={user.role} />
    <ToastContainer />
    {/* PWA 업데이트 배너 */}
    {needsUpdate && (
      <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 9998, backgroundColor: '#1e293b', color: 'white', padding: '10px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap', maxWidth: 'calc(100vw - 32px)' }}>
        <span>🔄 새 버전이 있습니다</span>
        <button onClick={applyUpdate} style={{ backgroundColor: '#e11d48', border: 'none', borderRadius: 8, padding: '5px 12px', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>업데이트</button>
        <button onClick={dismiss} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '5px 10px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>나중에</button>
      </div>
    )}
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
      <Sidebar
        currentView={store.currentView}
        onNavigate={view => store.navigate(view)}
        isDark={isDark}
        onToggleTheme={toggle}
        user={user}
        shopName={myShop?.name}
        onLogout={logout}
        pendingBookings={pendingBookings}
        designerRole={myDesignerRecord?.role}
      />
      {/* 모바일에서는 하단 탭 바 높이(약 68px)만큼 패딩 확보 */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 min-w-0">
        {/* 모바일 전용 상단 헤더 */}
        {mobileTitle && (
          <header className="md:hidden sticky top-0 z-10 border-b px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-rose-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-xs">J</span>
              </div>
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {myShop?.name ?? 'Hair JJaL'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-icon-rose)' }}>
                <span className="font-bold text-xs" style={{ color: 'var(--text-icon-rose)' }}>{user.name.charAt(0)}</span>
              </div>
              <span>{user.name}</span>
            </div>
          </header>
        )}

        {store.currentView === 'dashboard' && (
          <Suspense fallback={<div className="p-6"><SkeletonList rows={3} /></div>}>
            <Dashboard
              clients={visibleClients}
              consultations={visibleConsultations}
              bookings={shopBookings}
              designerName={isDesigner && !isManager ? user.designerName : undefined}
              onNavigate={store.navigate}
            />
          </Suspense>
        )}

        {store.currentView === 'clients' && (
          <Suspense fallback={<div className="p-6"><SkeletonList rows={3} /></div>}>
            <ClientList
              clients={visibleClients}
              consultations={visibleConsultations}
              shopId={shopId}
              onSelectClient={id => store.navigate('client-detail', id)}
              onAddClient={data => store.addClient({ ...data, shopId })}
              onLinkClient={async (authUserId, data) => {
                await store.addClient({ ...data, shopId, authUserId } as Parameters<typeof store.addClient>[0]);
              }}
              onDeleteClient={store.deleteClient}
            />
          </Suspense>
        )}

        {store.currentView === 'client-detail' && selectedClient && (
          <Suspense fallback={<div className="p-6"><SkeletonList rows={3} /></div>}>
            <ClientDetail
              client={selectedClient}
              consultations={clientConsultations}
              designers={shopDesigners}
              shopId={shopId}
              onBack={() => store.navigate('clients')}
              onUpdateClient={store.updateClient}
              onAddConsultation={data => store.addConsultation({ ...data, shopId })}
              onSelectConsultation={id => store.navigate('consultation-detail', selectedClient.id, id)}
              onDeleteConsultation={store.deleteConsultation}
            />
          </Suspense>
        )}

        {store.currentView === 'consultation-detail' && selectedConsultation && selectedClient && (
          <Suspense fallback={<div className="p-6"><SkeletonList rows={3} /></div>}>
            <ConsultationDetail
              consultation={selectedConsultation}
              client={selectedClient}
              onBack={() => store.navigate('client-detail', selectedClient.id)}
              onUpdate={store.updateConsultation}
              onDelete={store.deleteConsultation}
              onToggleShare={store.toggleShare}
            />
          </Suspense>
        )}

        {store.currentView === 'bookings' && (
          <Suspense fallback={<div className="p-6"><SkeletonList rows={3} /></div>}>
            <BookingList
              bookings={shopBookings}
              user={user}
              onUpdate={store.updateBooking}
            />
          </Suspense>
        )}

        {store.currentView === 'owner-staff' && user.role === 'owner' && (
          <Suspense fallback={<div className="p-6"><SkeletonList rows={3} /></div>}>
            <OwnerDashboard
              shop={myShop}
              clients={shopClients}
              consultations={shopConsultations}
              designers={shopDesigners}
              bookings={shopBookings}
              onAddDesigner={async (data, password) => {
                const designer = await store.addDesigner({ ...data, shopId });
                await addDesignerAccount({
                  shopId,
                  name: designer.name,
                  email: designer.email,
                  designerName: designer.name,
                  designerId: designer.id,
                  password,
                });
              }}
              onLinkDesigner={async (authUserId: string, data: Omit<import('./types').Designer, 'id' | 'shopId'>) => {
                // 같은 이메일의 기존 레코드(퇴직 포함)가 있으면 재활성화 — 중복 생성 방지
                // DATA-07: authUserId 도 함께 업데이트하여 로그인 연결 복원
                const existing = store.designers.find(
                  d => d.shopId === shopId && d.email.toLowerCase() === data.email.toLowerCase()
                );
                if (existing) {
                  await store.updateDesigner(existing.id, {
                    status:     'active',
                    leftAt:     undefined,
                    leftReason: undefined,
                    authUserId,  // 재활성화 시 Auth 계정 재연결
                  } as Parameters<typeof store.updateDesigner>[1]);
                } else {
                  await store.addDesigner({ ...data, shopId, authUserId });
                }
              }}
              onUpdateDesigner={(id, data) => {
                store.updateDesigner(id, data);
                // 3-3: 이름·이메일 변경 시 로그인 계정 동기화
                if (data.name !== undefined || data.email !== undefined) {
                  updateExtraUser(id, { name: data.name, email: data.email });
                }
                // 퇴직 처리 시 Auth 계정 비활성화
                if (data.status === 'inactive') {
                  disableDesignerAccount(id);
                }
              }}
              onUpdateShop={(data) => myShop && store.updateShop(myShop.id, data)}
            />
          </Suspense>
        )}

        {store.currentView === 'profile' && (
          <Suspense fallback={<div className="p-6"><SkeletonList rows={3} /></div>}>
            <StaffProfile
              user={user}
              designer={myDesignerRecord}
              shop={myShop}
              myConsultations={myOwnConsultations}
              shopConsultations={shopConsultations}
              shopClients={shopClients}
              shopDesigners={shopDesigners}
              shopBookings={shopBookings}
              onUpdateDesigner={(id, data) => {
                store.updateDesigner(id, data);
                // 3-3: 이름·이메일 변경 시 로그인 계정 동기화
                if (data.name !== undefined || data.email !== undefined) {
                  updateExtraUser(id, { name: data.name, email: data.email });
                }
              }}
              onUpdateShop={myShop ? (data) => store.updateShop(myShop.id, data) : undefined}
              onUpdateName={updateName}
              onChangePassword={changePassword}
            />
          </Suspense>
        )}

      </main>
    </div>
    </ErrorBoundary>
  );
}
