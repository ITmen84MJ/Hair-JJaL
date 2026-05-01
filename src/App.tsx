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
import { CustomerHome } from './components/Customer/CustomerHome';
import { CustomerConsultationView } from './components/Customer/CustomerConsultationView';
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

  // ── CUSTOMER view ──
  if (user.role === 'customer') {
    const myClient = user.clientId
      ? store.clients.find(c => c.id === user.clientId) ?? null
      : null;
    const myConsultations = myClient
      ? store.consultations.filter(c => c.clientId === myClient.id)
      : [];
    const myBookings = myClient
      ? store.bookings.filter(b => b.clientId === myClient.id)
      : [];

    // Consultation detail
    if (store.currentView === 'customer-consultation' && store.selectedConsultationId) {
      const con = store.consultations.find(c => c.id === store.selectedConsultationId) ?? null;
      if (con) return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
          <CustomerConsultationView consultation={con} onBack={() => store.navigate('customer-home')} />
        </div>
      );
    }

    // Booking form
    if (store.currentView === 'customer-booking' && myClient) {
      return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
          <CustomerBooking
            client={myClient}
            designers={store.designers}
            onSubmit={data => {
              store.addBooking(data);
              store.navigate('customer-home');
            }}
            onBack={() => store.navigate('customer-home')}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
        {/* Minimal top bar for customer */}
        <header className="sticky top-0 z-10 border-b px-5 py-3 flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-rose-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">J</span>
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Hair JJaL</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-2 rounded-lg text-sm" style={{ color: 'var(--text-muted)' }}>
              {isDark ? '☀️' : '🌙'}
            </button>
            <button onClick={logout}
              className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              로그아웃
            </button>
          </div>
        </header>
        <CustomerHome
          client={myClient}
          consultations={myConsultations}
          bookings={myBookings}
          onSelectConsultation={id => store.navigate('customer-consultation', undefined, id)}
          onNewBooking={() => store.navigate('customer-booking')}
        />
      </div>
    );
  }

  // ── DESIGNER / OWNER layout with Sidebar ──
  const isDesigner = user.role === 'designer';

  // Designer only sees their own clients/consultations
  const visibleConsultations = isDesigner && user.designerName
    ? store.consultations.filter(c => c.stylistName === user.designerName)
    : store.consultations;

  const visibleClientIds = new Set(visibleConsultations.map(c => c.clientId));
  const visibleClients = isDesigner
    ? store.clients.filter(c => visibleClientIds.has(c.id))
    : store.clients;

  const selectedClient = store.selectedClientId
    ? visibleClients.find(c => c.id === store.selectedClientId) ?? null
    : null;

  const selectedConsultation = store.selectedConsultationId
    ? store.consultations.find(c => c.id === store.selectedConsultationId) ?? null
    : null;

  const clientConsultations = selectedClient
    ? store.consultations.filter(c => c.clientId === selectedClient.id)
    : [];

  // Pending booking count for sidebar badge
  const pendingBookings = isDesigner && user.designerName
    ? store.bookings.filter(b => b.status === 'pending' && (!b.preferredDesigner || b.preferredDesigner === user.designerName)).length
    : store.bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
      <Sidebar
        currentView={store.currentView}
        onNavigate={view => store.navigate(view)}
        isDark={isDark}
        onToggleTheme={toggle}
        user={user}
        onLogout={logout}
        pendingBookings={pendingBookings}
      />
      <main className="flex-1 overflow-y-auto">

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
            onAddClient={store.addClient}
            onDeleteClient={store.deleteClient}
          />
        )}

        {store.currentView === 'client-detail' && selectedClient && (
          <ClientDetail
            client={selectedClient}
            consultations={clientConsultations}
            onBack={() => store.navigate('clients')}
            onUpdateClient={store.updateClient}
            onAddConsultation={store.addConsultation}
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
            bookings={store.bookings}
            user={user}
            onUpdate={store.updateBooking}
          />
        )}

        {store.currentView === 'owner-staff' && user.role === 'owner' && (
          <OwnerDashboard
            clients={store.clients}
            consultations={store.consultations}
            designers={store.designers}
            onAddDesigner={store.addDesigner}
            onUpdateDesigner={store.updateDesigner}
          />
        )}

      </main>
    </div>
  );
}
