import { useEffect } from 'react';
import { useStore } from './hooks/useStore';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ClientList } from './components/Clients/ClientList';
import { ClientDetail } from './components/Clients/ClientDetail';
import { ConsultationDetail } from './components/Consultations/ConsultationDetail';
import { ShareView } from './components/Share/ShareView';
import { LoginPage } from './components/Auth/LoginPage';
import { CustomerLayout } from './components/Customer/CustomerLayout';
import { CustomerBooking } from './components/Customer/CustomerBooking';
import { BookingList } from './components/Bookings/BookingList';
import { OwnerDashboard } from './components/Owner/OwnerDashboard';

export default function App() {
  const store = useStore();
  const { isDark, toggle } = useTheme();
  const { user, login, loginAs, logout } = useAuth();

  // Share link — always accessible without login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('share');
    if (token) store.navigate('share', undefined, undefined, token);
  }, []);

  // ── Share view (public) ──
  if (store.currentView === 'share') {
    const con = store.consultations.find(c => c.shareToken === store.shareToken && c.isShared) ?? null;
    const client = con ? store.clients.find(c => c.id === con.clientId) ?? null : null;
    return <ShareView consultation={con} client={client} />;
  }

  // ── Not logged in ──
  if (!user) {
    return <LoginPage onLogin={login} onLoginAs={loginAs} />;
  }

  // ── 지점(shop)별 데이터 격리 ──
  const shopId = user.shopId;
  const shopClients       = store.clients.filter(c  => c.shopId  === shopId);
  const shopConsultations = store.consultations.filter(c => c.shopId === shopId);
  const shopDesigners     = store.designers.filter(d => d.shopId  === shopId);
  const shopBookings      = store.bookings.filter(b  => b.shopId  === shopId);
  const myShop            = store.shops.find(s => s.id === shopId) ?? null;

  // ── CUSTOMER view ──
  if (user.role === 'customer') {
    const myClient = user.clientId
      ? shopClients.find(c => c.id === user.clientId) ?? null
      : null;
    const myConsultations = myClient
      ? shopConsultations.filter(c => c.clientId === myClient.id)
      : [];
    const myBookings = myClient
      ? shopBookings.filter(b => b.clientId === myClient.id)
      : [];

    // Booking form
    if (store.currentView === 'customer-booking' && myClient) {
      return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
          <CustomerBooking
            client={myClient}
            designers={shopDesigners}
            onSubmit={data => {
              store.addBooking({ ...data, shopId });
              store.navigate('customer-home');
            }}
            onBack={() => store.navigate('customer-home')}
          />
        </div>
      );
    }

    return (
      <CustomerLayout
        user={user}
        client={myClient}
        consultations={myConsultations}
        bookings={myBookings}
        shopName={myShop?.name}
        currentView={store.currentView}
        selectedConsultationId={store.selectedConsultationId}
        isDark={isDark}
        onToggleTheme={toggle}
        onLogout={logout}
        onNavigate={store.navigate}
        onSelectConsultation={id => store.navigate('customer-consultation', undefined, id)}
        onNewBooking={() => store.navigate('customer-booking')}
        onUpdateClient={(id, data) => store.updateClient(id, data)}
      />
    );
  }

  // ── DESIGNER / OWNER layout with Sidebar ──
  const isDesigner = user.role === 'designer';

  // Designer only sees their own clients/consultations (within the shop)
  const visibleConsultations = isDesigner && user.designerName
    ? shopConsultations.filter(c => c.stylistName === user.designerName)
    : shopConsultations;

  const visibleClientIds = new Set(visibleConsultations.map(c => c.clientId));
  // Clients with no consultations yet are visible to all designers in the shop
  const clientsWithAnyCon = new Set(shopConsultations.map(c => c.clientId));
  const visibleClients = isDesigner
    ? shopClients.filter(c => visibleClientIds.has(c.id) || !clientsWithAnyCon.has(c.id))
    : shopClients;

  const selectedClient = store.selectedClientId
    ? visibleClients.find(c => c.id === store.selectedClientId) ?? null
    : null;

  const selectedConsultation = store.selectedConsultationId
    ? shopConsultations.find(c => c.id === store.selectedConsultationId) ?? null
    : null;

  const clientConsultations = selectedClient
    ? shopConsultations.filter(c => c.clientId === selectedClient.id)
    : [];

  // Pending booking count for sidebar badge
  const pendingBookings = isDesigner && user.designerName
    ? shopBookings.filter(b => b.status === 'pending' && (!b.preferredDesigner || b.preferredDesigner === user.designerName)).length
    : shopBookings.filter(b => b.status === 'pending').length;

  // 모바일 상단 헤더용 뷰 제목
  const VIEW_TITLES: Partial<Record<typeof store.currentView, string>> = {
    dashboard: '대시보드', clients: '고객 관리', bookings: '예약 관리', 'owner-staff': '직원 관리',
  };
  const mobileTitle = VIEW_TITLES[store.currentView];

  return (
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
          <Dashboard
            clients={visibleClients}
            consultations={visibleConsultations}
            onNavigate={store.navigate}
          />
        )}

        {store.currentView === 'clients' && (
          <ClientList
            clients={visibleClients}
            consultations={visibleConsultations}
            onSelectClient={id => store.navigate('client-detail', id)}
            onAddClient={data => store.addClient({ ...data, shopId })}
            onDeleteClient={store.deleteClient}
          />
        )}

        {store.currentView === 'client-detail' && selectedClient && (
          <ClientDetail
            client={selectedClient}
            consultations={clientConsultations}
            onBack={() => store.navigate('clients')}
            onUpdateClient={store.updateClient}
            onAddConsultation={data => store.addConsultation({ ...data, shopId })}
            onSelectConsultation={id => store.navigate('consultation-detail', selectedClient.id, id)}
          />
        )}

        {store.currentView === 'consultation-detail' && selectedConsultation && selectedClient && (
          <ConsultationDetail
            consultation={selectedConsultation}
            client={selectedClient}
            onBack={() => store.navigate('client-detail', selectedClient.id)}
            onUpdate={store.updateConsultation}
            onDelete={store.deleteConsultation}
            onToggleShare={store.toggleShare}
          />
        )}

        {store.currentView === 'bookings' && (
          <BookingList
            bookings={shopBookings}
            user={user}
            onUpdate={store.updateBooking}
          />
        )}

        {store.currentView === 'owner-staff' && user.role === 'owner' && (
          <OwnerDashboard
            shop={myShop}
            clients={shopClients}
            consultations={shopConsultations}
            designers={shopDesigners}
            onAddDesigner={data => store.addDesigner({ ...data, shopId })}
            onUpdateDesigner={store.updateDesigner}
            onUpdateShop={(data) => myShop && store.updateShop(myShop.id, data)}
          />
        )}

      </main>
    </div>
  );
}
