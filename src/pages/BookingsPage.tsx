import { Icon } from '../components/Icons';
import { Avatar } from '../components/Avatar';
import { Stars } from '../components/Stars';
import { PitchArt } from '../components/PitchArt';
import { PageId } from '../components/Navigation';

interface BookingsPageProps {
  onNavigate: (page: PageId, params?: Record<string, any>) => void;
}

export function BookingsPage({ onNavigate }: BookingsPageProps) {
  const nearAcademies: { n: string; area: string; rate: number; price: number; id: number }[] = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('rabona_academies') || '[]');
      if (Array.isArray(s)) return s;
    } catch {}
    return [];
  })();

  return (
    <main className="wrap-bookings">
      <h1 className="h">مواعيدي</h1>
      <p className="sub">تابع مواعيدك وحجوزاتك من مكان واحد.</p>

      {/* Empty State */}
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
                <Avatar name={a.n} seed={a.id * 5 + 2} size={56} isSquare />
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
