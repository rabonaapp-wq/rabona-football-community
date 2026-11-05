import { useState, useEffect, useRef } from 'react';
import { Icon } from '../components/Icons';
import { Avatar } from '../components/Avatar';
import { Stars } from '../components/Stars';
import { PitchArt } from '../components/PitchArt';
import { PageId } from '../components/Navigation';
import { ACADEMIES_DATA, AcademyItem } from './AcademiesPage';

interface AcademyDetailPageProps {
  academyId?: string | number;
  autoSubscribe?: boolean;
  onNavigate: (page: PageId, params?: Record<string, any>) => void;
}

export function AcademyDetailPage({
  academyId = 0,
  autoSubscribe = false,
  onNavigate,
}: AcademyDetailPageProps) {
  const academiesList: AcademyItem[] = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('rabona_academies') || '[]');
      if (Array.isArray(s) && s.length > 0) return s;
    } catch {}
    return ACADEMIES_DATA;
  })();

  const academy: AcademyItem | undefined = academiesList.find((a) => String(a.id) === String(academyId));

  const [activePlanIdx, setActivePlanIdx] = useState(0);
  const [activeDot, setActiveDot] = useState(0);
  const [showSubModal, setShowSubModal] = useState(false);
  const plansSectionRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const coaches: { name: string; role: string }[] = [];
  const daysSchedule: { day: string; time: string; group: string }[] = [];
  const reviews: { name: string; role: string; rating: number; text: string }[] = [];

  if (!academy) {
    return (
      <main className="wrap-detail">
        <section className="missing" style={{ display: 'block', textAlign: 'center', padding: '60px 16px' }}>
          <h1>الأكاديمية غير موجودة</h1>
          <p>اختار أكاديمية من القائمة لعرض تفاصيلها.</p>
          <button type="button" className="btn" onClick={() => onNavigate('academies')}>
            عرض الأكاديميات
          </button>
        </section>
      </main>
    );
  }

  const basePrice = academy.price;
  const qPrice = Math.round((basePrice * 3 * 0.9) / 10) * 10;
  const yPrice = Math.round((basePrice * 12 * 0.75) / 10) * 10;

  const plans = [
    {
      key: 'm',
      title: 'اشتراك شهري',
      sub: 'بدون التزام',
      price: basePrice,
      unit: 'ج / شهر',
      badge: '',
    },
    {
      key: 'q',
      title: '3 شهور',
      sub: `توفير ${basePrice * 3 - qPrice} ج`,
      price: qPrice,
      unit: 'ج / 3 شهور',
      badge: 'الأوفر',
    },
    {
      key: 'y',
      title: 'سنوي',
      sub: `توفير ${basePrice * 12 - yPrice} ج`,
      price: yPrice,
      unit: 'ج / السنة',
      badge: 'الأوفر',
    },
  ];

  const selectedPlan = plans[activePlanIdx];

  useEffect(() => {
    if (autoSubscribe && plansSectionRef.current) {
      plansSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [autoSubscribe]);

  const handleGalleryScroll = () => {
    if (galleryRef.current && galleryRef.current.firstElementChild) {
      const el = galleryRef.current;
      const width = (el.firstElementChild as HTMLElement).offsetWidth + 8;
      const index = Math.round(Math.abs(el.scrollLeft) / width);
      setActiveDot(Math.min(index, 3));
    }
  };

  const mapQuery = encodeURIComponent(`${academy.n} ${academy.area}`);

  return (
    <main className="wrap-detail">
      <div id="details">
        {/* Gallery */}
        <div ref={galleryRef} onScroll={handleGalleryScroll} className="gal">
          {[0, 1, 2, 3].map((k) => (
            <div key={k} className="pic">
              {k === 0 && academy.cover ? (
                <img src={academy.cover} alt={`غلاف ${academy.n}`} />
              ) : (
                <PitchArt seed={(typeof academy.id === 'number' ? academy.id : academy.id.length) * 5 + 2 + k * 11} />
              )}
              {k === 0 && (
                <div className="over">
                  {academy.top === 1 && (
                    <span className="badge">
                      <Icon name="trophy" />
                      الأعلى تقييماً
                    </span>
                  )}
                  {academy.trial === 1 && (
                    <span className="badge dark">
                      <Icon name="gift" />
                      حصة تجريبية مجاناً
                    </span>
                  )}
                  {academy.spots <= 8 && (
                    <span className="badge amber">
                      <Icon name="flame" />
                      باقي {academy.spots} أماكن
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="dots">
          {[0, 1, 2, 3].map((d) => (
            <i key={d} className={activeDot === d ? 'on' : ''} />
          ))}
        </div>

        {/* Head */}
        <div className="head-detail">
          <Avatar
            name={academy.n}
            seed={(typeof academy.id === 'number' ? academy.id : academy.id.length) * 5 + 2}
            size={68}
            isSquare
            img={academy.logo}
            className="rounded-[20px]"
            style={{ border: '3px solid var(--green)' }}
          />
          <div className="page-title">
            <small className="page-label">صفحة أكاديمية</small>
            <h1>{academy.n}</h1>
            <div className="meta-detail">
              <span>
                <Icon name="pin" />
                <span>{academy.area}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Stars rating={academy.rate} />
                <span>({academy.reviews})</span>
              </span>
            </div>
            <p>{academy.bio || `أكاديمية كرة قدم لتطوير اللاعبين من ${academy.min} إلى ${academy.max} سنة.`}</p>
          </div>
        </div>

        <div className="page-actions">
          <button type="button" className="btn ghost">متابعة</button>
          <button type="button" className="btn" onClick={() => setShowSubModal(true)}>اشترك الآن</button>
        </div>

        <nav className="page-tabs" aria-label="أقسام صفحة الأكاديمية">
          <a href="#about">المنشورات</a>
          <a href="#about">المعلومات</a>
          <a href="#location">الموقع</a>
        </nav>

        {/* KPIs */}
        <div className="kpis">
          <div>
            <span className="num">{academy.rate}</span>
            <span className="l">التقييم</span>
          </div>
          <div>
            <span className="num">{academy.players}</span>
            <span className="l">لاعب</span>
          </div>
          <div>
            <span className="num">{academy.min}–{academy.max}</span>
            <span className="l">السن</span>
          </div>
          <div>
            <span className="num">{academy.spots}</span>
            <span className="l">مكان متاح</span>
          </div>
        </div>

        {/* About */}
        <section className="s" id="about">
          <h2 className="h">عن الأكاديمية</h2>
          <p className="desc">
            {academy.n} بتدرّب لاعبين من {academy.min} لحد {academy.max} سنة على أيدي مدربين
            معتمدين، بخطة تطوير فردية لكل لاعب وماتشات ودية شهرية. الهدف إن اللاعب يتعلم
            الأساسيات صح ويستمتع بالكورة.
          </p>
          <div className="feat">
            {(academy.categories && academy.categories.length > 0
              ? academy.categories
              : ['بطولات ودية', 'مدربين معروفين', 'اتحاد الكورة']
            ).map((cat, idx) => (
              <span key={idx}>
                <Icon name="check" style={{ width: 15, height: 15, color: 'var(--green)' }} />
                {cat}
              </span>
            ))}
          </div>
        </section>

        {/* Plans */}
        <section className="s" ref={plansSectionRef}>
          <h2 className="h">الباقات</h2>
          <div className="plans">
            {plans.map((p, idx) => {
              const isSelected = activePlanIdx === idx;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setActivePlanIdx(idx)}
                  className={`plan ${isSelected ? 'on' : ''}`}
                >
                  {p.badge && <span className="badge">{p.badge}</span>}
                  <span className="rd">
                    <i />
                  </span>
                  <span className="t">
                    <b>{p.title}</b>
                    <small>{p.sub}</small>
                  </span>
                  <span className="p">
                    <span className="num">{p.price}</span>
                    <small>{p.unit}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Schedule */}
        <section className="s">
          <h2 className="h">مواعيد التدريب</h2>
          <div className="sched">
            {daysSchedule.map((s, idx) => (
              <div key={idx} className="r">
                <span className="d">{s.day}</span>
                <span className="tm">
                  <Icon name="clock" />
                  <span className="num">{s.time}</span>
                </span>
                <span className="g">{s.group}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Coaches */}
        <section className="s">
          <h2 className="h">المدربين</h2>
          <div className="coaches">
            {coaches.map((c, idx) => (
              <div key={idx} className="coach">
                <Avatar
                  name={c.name.replace('كابتن ', '')}
                  seed={(typeof academy.id === 'number' ? academy.id : academy.id.length) * 7 + idx + 30}
                  size={64}
                />
                <b>{c.name}</b>
                <small>{c.role}</small>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section className="s">
          <h2 className="h">آراء أولياء الأمور واللاعبين</h2>
          <div className="sum">
            <div style={{ textAlign: 'center' }}>
              <div className="big">{academy.rate}</div>
              <Stars rating={academy.rate} />
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
                {academy.reviews} تقييم
              </div>
            </div>
            <div className="bars">
              {[62, 24, 9, 3, 2].map((v, idx) => (
                <div key={idx}>
                  {5 - idx}
                  <i>
                    <b style={{ width: `${v}%` }} />
                  </i>
                </div>
              ))}
            </div>
          </div>
          <div id="rvs">
            {reviews.map((r, idx) => (
              <div key={idx} className="rv">
                <div className="t">
                  <Avatar name={r.name} seed={idx + 60} size={40} />
                  <div>
                    <b>{r.name}</b>
                    <small>{r.role}</small>
                  </div>
                  <div style={{ marginInlineStart: 'auto' }}>
                    <Stars rating={r.rating} />
                  </div>
                </div>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Map */}
        <section className="s" id="location">
          <h2 className="h">الموقع</h2>
          <a
            className="map"
            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 400 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <rect width="400" height="170" fill="#101510" />
              <g stroke="#1d261d" strokeWidth="10" fill="none">
                <path d="M-10 60 L410 90" />
                <path d="M-10 130 L410 110" />
                <path d="M90 -10 L120 180" />
                <path d="M250 -10 L230 180" />
              </g>
              <g stroke="#192219" strokeWidth="4" fill="none">
                <path d="M-10 20 L410 30" />
                <path d="M170 -10 L180 180" />
                <path d="M330 -10 L350 180" />
              </g>
              <g transform="translate(200 78)">
                <circle r="26" fill="#00C853" opacity=".15" />
                <circle r="14" fill="#00C853" opacity=".25" />
                <path
                  d="M0 14c8-8 11-13 11-19a11 11 0 0 0-22 0c0 6 3 11 11 19z"
                  fill="#00C853"
                  transform="translate(0 -4)"
                />
                <circle cy="-13" r="4" fill="#04170B" />
              </g>
            </svg>
            <div className="lab">
              <Icon name="pin" />
              <div>
                <b>{academy.n}</b>
                <small>{academy.area}</small>
              </div>
              <span className="btn">افتح الخريطة</span>
            </div>
          </a>
        </section>

        <p className="login" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13.5px', marginTop: '22px' }}>
          عندك حساب بالفعل؟{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            style={{ color: 'var(--green)', fontWeight: 700 }}
          >
            سجّل دخولك
          </button>
        </p>

        {/* Sticky Buy */}
        <div className="buy">
          <div>
            <div className="pr">
              <small id="buyLbl">{selectedPlan.title}</small>
              <span className="num" id="buyP">
                {selectedPlan.price}
                <i>ج</i>
              </span>
            </div>
            <button
              type="button"
              className="btn lg"
              onClick={() => setShowSubModal(true)}
            >
              اشترك الآن
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubModal && (
        <div className="mo" onClick={() => setShowSubModal(false)}>
          <div className="md" onClick={(e) => e.stopPropagation()}>
            <h2 className="h">تأكيد الاشتراك في {academy.n}</h2>
            <p>
              لقد اخترت باقة <b>{selectedPlan.title}</b> بقيمة{' '}
              <b style={{ color: 'var(--green)' }}>{selectedPlan.price} ج</b>.
            </p>
            <div className="acts">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setShowSubModal(false)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowSubModal(false);
                  onNavigate('signup');
                }}
              >
                متابعة التسجيل
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
