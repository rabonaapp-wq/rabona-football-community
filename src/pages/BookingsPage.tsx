import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { Icon } from '../components/Icons';
import { Avatar } from '../components/Avatar';
import { Stars } from '../components/Stars';
import { PitchArt } from '../components/PitchArt';
import { PageId } from '../components/Navigation';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface BookingsPageProps {
  onNavigate: (page: PageId, params?: Record<string, any>) => void;
}

export function BookingsPage({ onNavigate }: BookingsPageProps) {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsError, setBookingsError] = useState(false);
  const nearAcademies: { n: string; area: string; rate: number; price: number; id: string | number }[] = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('rabona_academies') || '[]');
      if (Array.isArray(s)) return s;
    } catch {}
    return [];
  })();

  useEffect(() => {
    if (!currentUser) return;
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('userUid', '==', currentUser.uid),
      limit(50)
    );
    return onSnapshot(
      bookingsQuery,
      (snapshot) => {
        setBookings(snapshot.docs.map((booking) => ({ id: booking.id, ...booking.data() })));
        setBookingsError(false);
      },
      () => setBookingsError(true)
    );
  }, [currentUser]);

  return (
    <main className="wrap-bookings">
      <h1 className="h">مواعيدي</h1>
      <p className="sub">تابع مواعيدك وحجوزاتك من مكان واحد.</p>

      {bookingsError && (
        <p style={{ color: 'var(--err)', margin: '14px 0' }}>تعذر تحميل حجوزاتك حاليًا.</p>
      )}

      {bookings.length > 0 ? (
        <section className="gl" style={{ marginTop: '18px' }}>
          {bookings.map((booking) => (
            <div className="r-setting" key={booking.id}>
              <span className="t">
                <b>{booking.planName || 'اشتراك أكاديمية'}</b>
                <small>الأكاديمية: {nearAcademies.find((academy) => String(academy.id) === String(booking.academyId))?.n || booking.academyId}</small>
              </span>
              <span style={{ color: booking.status === 'confirmed' ? 'var(--green)' : 'var(--amber)', fontSize: '13px', fontWeight: 700 }}>
                {booking.status === 'confirmed' ? 'مؤكد' : booking.status === 'cancelled' ? 'ملغي' : 'قيد المراجعة'}
              </span>
            </div>
          ))}
        </section>
      ) : (
      /* Empty State */
      <section className="empty-bookings">
        <div className="scene pic diag">
          <PitchArt seed={77} />
          <div className="ghost">
            <b>00:00</b>
          </div>
        </div>
        <div className="tx">
          <h2>لسه مفيش مواعيد</h2>
          <p>أول تمرين ليك على بعد اشتراك واحد. اختار أكاديميتك وهتلاقي جدولك هنا.</p>
          <div className="actions">
            <button
              type="button"
              className="btn"
              onClick={() => onNavigate('academies')}
            >
              اكتشف الأكاديميات
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => onNavigate('login')}
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
      </section>
      )}

      {/* Near Academies Section */}
      {nearAcademies.length > 0 && (
        <>
          <div className="hl">
            <h2 className="h">أكاديميات قريبة منك</h2>
            <button
              type="button"
              onClick={() => onNavigate('academies')}
              style={{ background: 'none', border: 0, color: 'var(--green)', fontWeight: 700, cursor: 'pointer' }}
            >
              عرض الكل
            </button>
          </div>

          <div className="sg-bookings">
            {nearAcademies.map((a) => (
              <button
                key={a.id}
                type="button"
                className="s-card"
                onClick={() => onNavigate('academy', { id: a.id })}
              >
                <Avatar name={a.n} seed={(typeof a.id === 'number' ? a.id : a.id.length) * 5 + 2} size={56} isSquare />
                <div className="t">
                  <b>{a.n}</b>
                  <small>
                    <span>
                      <Icon name="pin" />
                      {a.area}
                    </span>
                    <span>
                      <Stars rating={a.rate} />
                    </span>
                  </small>
                </div>
                <div className="pr">
                  <span className="num">{a.price}</span>
                  <small>ج / شهر</small>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
