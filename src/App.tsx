import { useState, useEffect } from 'react';
import { Navigation, PageId } from './components/Navigation';
import { HomeFeed } from './pages/HomeFeed';
import { AcademiesPage } from './pages/AcademiesPage';
import { AcademyDetailPage } from './pages/AcademyDetailPage';
import { BookingsPage } from './pages/BookingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { NewPostPage } from './pages/NewPostPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { StorePage } from './pages/StorePage';
import { DemoCheckoutPage } from './pages/DemoCheckoutPage';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { currentUser, userProfile, isAdmin, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageId>('login');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});
  const [globalSearch, setGlobalSearch] = useState('');

  // Handle URL hash or params
  useEffect(() => {
    const handleUrlChange = () => {
      const hash = window.location.hash.replace('#', '');
      const params = new URLSearchParams(window.location.search);
      const academyId = params.get('id');
      const subscribe = params.get('subscribe') === 'true';

      if (academyId !== null) {
        setCurrentPage('academy');
        setPageParams({ id: academyId, subscribe });
        return;
      }

      if (hash === 'orders') {
        setCurrentPage('store');
        setPageParams({ openOrders: true });
        return;
      }

      if (
        [
          'home',
          'store',
          'academies',
          'academy',
          'bookings',
          'profile',
          'new-post',
          'admin',
          'login',
          'signup',
          'settings',
          'notifications',
          'demo-checkout',
        ].includes(hash)
      ) {
        setCurrentPage(hash as PageId);
      }
    };

    handleUrlChange();
    window.addEventListener('hashchange', handleUrlChange);
    return () => window.removeEventListener('hashchange', handleUrlChange);
  }, []);

  // Strict Auth Gate: If not logged in and not loading, direct to login window unless user is in signup flow
  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        if (currentPage !== 'signup') {
          setCurrentPage('login');
          window.location.hash = 'login';
        }
      } else {
        // Existing accounts go home after their profile has been loaded.
        // New Google accounts stay on signup until they complete onboarding.
        if (currentPage === 'login' && userProfile?.isRegistered) {
          setCurrentPage('home');
          window.location.hash = 'home';
        }
      }
    }
  }, [currentUser, userProfile, loading, currentPage]);

  const isAuthPage = currentPage === 'login' || currentPage === 'signup';

  useEffect(() => {
    if (isAuthPage) {
      document.body.classList.add('auth-mode');
    } else {
      document.body.classList.remove('auth-mode');
    }
  }, [isAuthPage]);

  const navigateTo = (page: PageId, params?: Record<string, any>) => {
    // Prevent navigating away from login/signup if unauthenticated
    if (!currentUser && page !== 'login' && page !== 'signup') {
      setCurrentPage('login');
      window.location.hash = 'login';
      return;
    }
    if (page === 'admin' && !isAdmin) {
      setCurrentPage('home');
      window.location.hash = 'home';
      return;
    }
    setCurrentPage(page);
    setPageParams(params || {});
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          width: '100%',
          minHeight: '100vh',
          background: 'var(--black)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src="/images/logo.png"
          alt="Rabona"
          style={{ width: '90px', height: 'auto', opacity: 0.8 }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--black)] text-[var(--white)] selection:bg-[var(--green)]/30">
      {/* Navigation Shell only shown when authenticated and not on login/signup */}
      <Navigation
        currentPage={currentPage}
        onNavigate={navigateTo}
        searchQuery={globalSearch}
        onSearchChange={(q) => {
          setGlobalSearch(q);
          if (currentPage !== 'academies' && q.trim()) {
            navigateTo('academies');
          }
        }}
      />

      {/* Main Page View */}
      <main className="app-content relative">
        {currentPage === 'home' && <HomeFeed onNavigate={navigateTo} />}
        {currentPage === 'store' && (
          <StorePage
            onNavigate={navigateTo}
            openCartInitially={pageParams.openCart}
            openOrdersInitially={pageParams.openOrders}
          />
        )}
        {currentPage === 'academies' && (
          <AcademiesPage onNavigate={navigateTo} initialQuery={globalSearch} />
        )}
        {currentPage === 'academy' && (
          <AcademyDetailPage
            academyId={pageParams.id ?? 0}
            autoSubscribe={pageParams.subscribe ?? false}
            onNavigate={navigateTo}
          />
        )}
        {currentPage === 'bookings' && <BookingsPage onNavigate={navigateTo} />}
        {currentPage === 'profile' && (
          <ProfilePage onNavigate={navigateTo} viewUid={pageParams.uid} />
        )}
        {currentPage === 'new-post' && <NewPostPage onNavigate={navigateTo} />}
        {currentPage === 'admin' && <AdminDashboard onNavigate={navigateTo} />}
        {currentPage === 'login' && <LoginPage onNavigate={navigateTo} />}
        {currentPage === 'signup' && (
          <SignupPage
            onNavigate={navigateTo}
            initialAccountType={pageParams.accountType}
          />
        )}
        {currentPage === 'settings' && <SettingsPage onNavigate={navigateTo} />}
        {currentPage === 'notifications' && (
          <NotificationsPage onNavigate={navigateTo} />
        )}
        {currentPage === 'demo-checkout' && (
          <DemoCheckoutPage
            onNavigate={navigateTo}
            academyName={pageParams.academyName || 'أكاديمية'}
            planName={pageParams.planName || 'اشتراك'}
            amount={Number(pageParams.amount) || 0}
          />
        )}
      </main>
    </div>
  );
}
