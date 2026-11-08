import { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { Avatar } from './Avatar';
import { getUnreadCount } from '../utils/notifications';
import { useAuth } from '../context/AuthContext';

export type PageId =
  | 'home'
  | 'store'
  | 'academies'
  | 'academy'
  | 'bookings'
  | 'profile'
  | 'new-post'
  | 'admin'
  | 'login'
  | 'signup'
  | 'settings'
  | 'notifications'
  | 'demo-checkout';

interface NavigationProps {
  currentPage: PageId;
  onNavigate: (page: PageId, params?: Record<string, any>) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export function Navigation({
  currentPage,
  onNavigate,
  searchQuery = '',
  onSearchChange,
}: NavigationProps) {
  const { currentUser: authUser, userProfile, isAdmin, isAcademyOwner } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    const updateCount = () => {
      setUnreadCount(getUnreadCount());
    };
    updateCount();
    window.addEventListener('rabona_notif_changed', updateCount);
    return () => window.removeEventListener('rabona_notif_changed', updateCount);
  }, []);

  useEffect(() => {
    const updateCart = () => {
      try {
        const s = JSON.parse(localStorage.getItem('rabona_cart') || '[]');
        if (Array.isArray(s)) {
          const total = s.reduce((acc: number, item: any) => acc + (Number(item.q) || 0), 0);
          setCartCount(total);
          return;
        }
      } catch {}
      setCartCount(0);
    };
    updateCart();
    window.addEventListener('rabona_cart_changed', updateCart);
    return () => window.removeEventListener('rabona_cart_changed', updateCart);
  }, []);

  const isAuthPage = currentPage === 'login' || currentPage === 'signup';

  if (isAuthPage) {
    return null;
  }

  return (
    <>
      {/* ── Top Bar ── */}
      <header className="top">
        <div>
          <button
            type="button"
            className="brand"
            onClick={() => onNavigate('home')}
          >
            RABON<b>A</b>
            <span className="slashes" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </button>

          <nav className="dnav">
            <button
              type="button"
              className={currentPage === 'home' ? 'on' : ''}
              onClick={() => onNavigate('home')}
            >
              <Icon name="home" />
              الرئيسية
            </button>
            <button
              type="button"
              className={currentPage === 'academies' ? 'on' : ''}
              onClick={() => onNavigate('academies')}
            >
              <Icon name="cap" />
              أكاديميات
            </button>
            <button
              type="button"
              className={currentPage === 'bookings' ? 'on' : ''}
              onClick={() => onNavigate('bookings')}
            >
              <Icon name="cal" />
              المواعيد
            </button>
            <button
              type="button"
              className={currentPage === 'store' ? 'on' : ''}
              onClick={() => onNavigate('store')}
            >
              <Icon name="bag" />
              المتجر
            </button>
            <button
              type="button"
              className={currentPage === 'profile' ? 'on' : ''}
              onClick={() => onNavigate('profile')}
            >
              <Icon name="user" />
              حسابي
            </button>
            <button
              type="button"
              className={currentPage === 'settings' ? 'on' : ''}
              onClick={() => onNavigate('settings')}
            >
              <Icon name="gear" />
              الإعدادات
            </button>
          </nav>

          <label className="dsearch">
            <Icon name="search" />
            <input
              type="search"
              placeholder="ابحث عن لاعب أو أكاديمية"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </label>

          <button
            type="button"
            className="ib ms"
            aria-label="بحث"
            onClick={() => onNavigate('academies')}
          >
            <Icon name="search" />
          </button>

          <button
            type="button"
            className="ib top-store"
            aria-label="المتجر"
            style={currentPage === 'store' ? { color: 'var(--green)' } : {}}
            onClick={() => onNavigate('store')}
          >
            <Icon name="bag" />
          </button>

          <button
            type="button"
            className="ib top-notifications"
            aria-label="الإشعارات"
            style={currentPage === 'notifications' ? { color: 'var(--green)' } : {}}
            onClick={() => onNavigate('notifications')}
          >
            <Icon name="bell" />
          </button>

          <button
            type="button"
            className="ib top-settings"
            aria-label="الإعدادات"
            style={currentPage === 'settings' ? { color: 'var(--green)' } : {}}
            onClick={() => onNavigate('settings')}
          >
            <Icon name="gear" />
          </button>

          <button
            type="button"
            className="ib top-profile"
            aria-label="حسابي"
            onClick={() => onNavigate('profile')}
            style={{
              padding: 0,
              overflow: 'hidden',
              borderRadius: '50%',
              width: 36,
              height: 36,
              border: currentPage === 'profile' ? '2px solid var(--green)' : '1px solid var(--line)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
            title="حسابي"
          >
            <Avatar
              name={userProfile?.displayName || authUser?.displayName || authUser?.email?.split('@')[0] || 'حسابي'}
              seed={1}
              size={36}
              img={userProfile?.photoURL || authUser?.photoURL || ''}
            />
          </button>
        </div>
      </header>

      {/* ── Bottom Bar for Mobile (<768px) ── */}
      <nav className="bar">
        <div>
          <button
            type="button"
            className={currentPage === 'home' ? 'on' : ''}
            onClick={() => onNavigate('home')}
          >
            <Icon name="home" />
            الرئيسية
          </button>
          <button
            type="button"
            className={currentPage === 'academies' ? 'on' : ''}
            onClick={() => onNavigate('academies')}
          >
            <Icon name="cap" />
            أكاديميات
          </button>
          <button
            type="button"
            className="fab"
            aria-label="منشور جديد"
            onClick={() => onNavigate('new-post')}
          >
            <span>
              <Icon name="plus" />
            </span>
          </button>
          <button
            type="button"
            className={currentPage === 'bookings' ? 'on' : ''}
            onClick={() => onNavigate('bookings')}
          >
            <Icon name="cal" />
            المواعيد
          </button>
          <button
            type="button"
            className={currentPage === 'profile' ? 'on' : ''}
            onClick={() => onNavigate('profile')}
          >
            <Icon name="user" />
            حسابي
          </button>
          <button
            type="button"
            className={currentPage === 'settings' ? 'on' : ''}
            onClick={() => onNavigate('settings')}
          >
            <Icon name="gear" />
            الإعدادات
          </button>
        </div>
      </nav>

      {/* ── Desktop Rail Sidebar (>=1024px) ── */}
      <aside className="rail">
        <button
          type="button"
          className="brand"
          onClick={() => onNavigate('home')}
        >
          RABON<b>A</b>
          <span className="slashes" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </button>

        <nav>
          <button
            type="button"
            className={currentPage === 'home' ? 'on' : ''}
            onClick={() => onNavigate('home')}
          >
            <Icon name="home" />
            الرئيسية
          </button>
          <button
            type="button"
            className={currentPage === 'store' ? 'on' : ''}
            onClick={() => onNavigate('store')}
          >
            <Icon name="bag" />
            المتجر
          </button>
          <button
            type="button"
            onClick={() => onNavigate('store', { openOrders: true })}
          >
            <Icon name="rec" />
            طلباتي
          </button>
          <button
            type="button"
            className={currentPage === 'academies' ? 'on' : ''}
            onClick={() => onNavigate('academies')}
          >
            <Icon name="cap" />
            أكاديميات
          </button>
          <button
            type="button"
            className={currentPage === 'bookings' ? 'on' : ''}
            onClick={() => onNavigate('bookings')}
          >
            <Icon name="cal" />
            المواعيد
          </button>
          <button
            type="button"
            className={currentPage === 'profile' ? 'on' : ''}
            onClick={() => onNavigate('profile')}
          >
            <Icon name="user" />
            حسابي
          </button>
          <button
            type="button"
            className={currentPage === 'notifications' ? 'on' : ''}
            onClick={() => onNavigate('notifications')}
          >
            <Icon name="bell" />
            الإشعارات
            {unreadCount > 0 && (
              <span
                className="badge"
                style={{
                  marginInlineStart: 'auto',
                  height: 20,
                  fontSize: 11,
                  paddingInline: 8,
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className={currentPage === 'settings' ? 'on' : ''}
            onClick={() => onNavigate('settings')}
          >
            <Icon name="gear" />
            الإعدادات
          </button>
          {isAdmin && (
            <button
              type="button"
              className={currentPage === 'admin' ? 'on' : ''}
              onClick={() => onNavigate('admin')}
              style={{ marginTop: '8px', border: '1px solid var(--line)' }}
            >
              <Icon name="whistle" />
              لوحة الإدارة
            </button>
          )}
        </nav>

        <button
          type="button"
          className="btn"
          style={{ marginTop: '12px' }}
          onClick={() => {
            if (currentPage === 'store') {
              window.dispatchEvent(new Event('rabona_open_cart'));
            } else {
              onNavigate('store', { openCart: true });
            }
          }}
        >
          <Icon name="cart" />
          السلة <span className="cc num">{cartCount}</span>
        </button>

        <button
          type="button"
          className="btn lg"
          onClick={() => onNavigate('new-post')}
        >
          <Icon name="plus" />
          منشور جديد
        </button>

        {(() => {
          const name = userProfile?.displayName || authUser?.displayName || authUser?.email?.split('@')[0] || 'حسابي';
          const role = userProfile?.role === 'academy' ? 'أكاديمية' : userProfile?.role === 'coach' ? 'مدرب' : 'لاعب';
          const photo = userProfile?.photoURL || authUser?.photoURL || '';

          return (
            <button
              type="button"
              className="me"
              onClick={() => onNavigate('profile')}
            >
              <Avatar name={name} seed={1} size={40} img={photo} />
              <span>
                <b>{name}</b>
                <small>{role}</small>
              </span>
            </button>
          );
        })()}
      </aside>
    </>
  );
}
