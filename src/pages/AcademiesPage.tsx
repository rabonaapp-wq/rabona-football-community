import { useState, useMemo, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Icon } from '../components/Icons';
import { Avatar } from '../components/Avatar';
import { Stars } from '../components/Stars';
import { PitchArt } from '../components/PitchArt';
import { PageId } from '../components/Navigation';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { useAuth } from '../context/AuthContext';

interface AcademiesPageProps {
  onNavigate: (page: PageId, params?: Record<string, any>) => void;
  initialQuery?: string;
}

export interface AcademyItem {
  id: string | number;
  n: string;
  area: string;
  address?: string;
  rate: number;
  reviews: number;
  min: number;
  max: number;
  players: number;
  price: number;
  spots: number;
  cap: number;
  trial?: number;
  top?: number;
  categories?: string[];
  cover?: string;
  logo?: string;
  bio?: string;
}

export const ACADEMIES_DATA: AcademyItem[] = [];

export function AcademiesPage({ onNavigate, initialQuery = '' }: AcademiesPageProps) {
  const { userProfile } = useAuth();
  const [search, setSearch] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState('all');

  const [academies, setAcademies] = useState<AcademyItem[]>(() => {
    try {
      const s = JSON.parse(localStorage.getItem('rabona_academies') || '[]');
      if (Array.isArray(s) && s.length > 0) return s;
    } catch {}
    return ACADEMIES_DATA;
  });

  useEffect(() => {
    const academiesQuery = query(collection(db, 'academies'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      academiesQuery,
      (snapshot) => {
        const firestoreAcademies: AcademyItem[] = snapshot.docs.map((academyDoc) => {
          const data = academyDoc.data();
          return {
            id: academyDoc.id,
            n: data.name || 'أكاديمية بدون اسم',
            area: [data.governorate, data.city].filter(Boolean).join(' - ') || data.address || 'الموقع غير محدد',
            address: data.address || '',
            rate: Number(data.rate) || 0,
            reviews: Number(data.reviewsCount) || 0,
            min: Number(data.minAge) || 6,
            max: Number(data.maxAge) || 18,
            players: Number(data.playersCount) || 0,
            price: Number(data.price) || 0,
            spots: Number(data.spots) || 0,
            cap: Number(data.cap) || 25,
            categories: Array.isArray(data.categories) ? data.categories : [],
            cover: data.cover || '',
            logo: data.logo || data.photoURL || '',
            bio: data.bio || '',
          };
        });
        setAcademies(firestoreAcademies);
        localStorage.setItem('rabona_academies', JSON.stringify(firestoreAcademies));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'academies')
    );
  }, []);

  const normalized = (value: string) => value.trim().toLocaleLowerCase('ar-EG');
  const userLocation = userProfile?.playerData || userProfile?.coachData;
  const locationScore = (academy: AcademyItem) => {
    if (!userLocation) return 0;
    const academyText = normalized(`${academy.n} ${academy.area} ${academy.address || ''}`);
    const city = normalized(userLocation.city || '');
    const governorate = normalized(userLocation.governorate || '');
    const address = normalized(userLocation.address || '');
    if (address && academyText.includes(address)) return 4;
    if (city && academyText.includes(city)) return 3;
    if (governorate && academyText.includes(governorate)) return 2;
    return 0;
  };

  const filters = [
    { key: 'all', label: 'الكل' },
    { key: 'friendly', label: 'بطولات ودية' },
    { key: 'official', label: 'بطولات رسمية' },
    { key: 'fa', label: 'اتحاد الكورة' },
    { key: 'coaches', label: 'مدربين معروفين' },
    { key: 'former', label: 'لاعبين سابقين' },
    { key: 'u10', label: 'تحت 10 سنين' },
    { key: 'm', label: 'من 10 لـ 14' },
    { key: 'o', label: '15 فما فوق' },
    { key: 'p', label: 'الأقل سعراً' },
  ];

  const filteredAcademies = useMemo(() => {
    let list = academies.filter((a) => {
      const matchesSearch =
        !search.trim() || (a.n + ' ' + a.area).toLowerCase().includes(search.trim().toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === 'all' || activeFilter === 'p') return true;
      if (activeFilter === 'u10') return a.min < 10;
      if (activeFilter === 'm') return a.min <= 14 && a.max >= 10;
      if (activeFilter === 'o') return a.max >= 15;
      if (activeFilter === 'friendly') return a.categories?.includes('بطولات ودية');
      if (activeFilter === 'official') return a.categories?.includes('بطولات رسمية');
      if (activeFilter === 'fa') return a.categories?.includes('اتحاد الكورة');
      if (activeFilter === 'coaches') return a.categories?.includes('مدربين معروفين');
      if (activeFilter === 'former') return a.categories?.includes('لاعبين سابقين');

      return true;
    });

    if (activeFilter === 'p') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (userLocation) {
      list = [...list].sort((a, b) => locationScore(b) - locationScore(a));
    }

    return list;
  }, [search, activeFilter, academies, userLocation]);

  return (
    <main className="wrap-academies">
      {/* ── Hero Section ── */}
      <section className="hero diag">
        <h1>
          اختار أكاديميتك
          <br />
          <em>وابدأ رحلتك</em>
        </h1>
        <p>أكاديميات معتمدة، مدربين محترفين، واشتراك من التطبيق.</p>
        <span className="big" aria-hidden="true">
          06
        </span>
        <label className="search-academies">
          <Icon name="search" />
          <input
            id="q"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم الأكاديمية أو المنطقة"
            autoComplete="off"
          />
        </label>
      </section>

      {/* ── Chips ── */}
      <div className="chips">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActiveFilter(f.key)}
            className={`chip ${activeFilter === f.key ? 'on' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="count">
        <b>{filteredAcademies.length}</b> أكاديمية
      </p>

      {/* ── Grid of Academies ── */}
      {filteredAcademies.length > 0 ? (
        <div className="grid-academies">
          {filteredAcademies.map((a) => {
            const isLowSpots = a.spots <= 8;
            const pct = Math.round((1 - a.spots / a.cap) * 100);

            return (
              <article key={a.id} className="card">
                <div className="cover pic">
                  {a.cover ? (
                    <img src={a.cover} alt={a.n} />
                  ) : (
                    <PitchArt seed={typeof a.id === 'number' ? a.id * 5 + 2 : a.id.length * 5 + 2} />
                  )}
                  <div className="over tl">
                    {a.top === 1 && (
                      <span className="badge">
                        <Icon name="trophy" />
                        الأعلى تقييماً
                      </span>
                    )}
                    {a.trial === 1 && (
                      <span className="badge dark">
                        <Icon name="gift" />
                        حصة تجريبية مجاناً
                      </span>
                    )}
                  </div>
                  <span className="rate">
                    <svg viewBox="0 0 24 24">
                      <path d="m12 2 3 6.5 7 .9-5.2 4.8 1.4 7L12 17.6 5.8 21.2l1.4-7L2 9.4l7-.9z" />
                    </svg>
                    {a.rate}
                  </span>
                </div>

                <div className="logo-academy">
                  <Avatar
                    name={a.n}
                    seed={(typeof a.id === 'number' ? a.id : a.id.length) * 5 + 2}
                    size={64}
                    isSquare
                    img={a.logo}
                    className="w-full h-full"
                  />
                </div>

                <div className="body-academy">
                  <h2 className="name-academy">{a.n}</h2>
                  <div className="rv">
                    <Stars rating={a.rate} />
                    <span>({a.reviews} تقييم)</span>
                  </div>
                  <div className="row-academy">
                    <Icon name="pin" />
                    {a.area}
                  </div>
                  <div className="row-academy">
                    <Icon name="users" />
                    من {a.min} لـ {a.max} سنة · {a.players} لاعب
                  </div>

                  <div className={`spots ${isLowSpots ? 'low' : ''}`}>
                    <div className={`t ${isLowSpots ? 'low' : ''}`}>
                      <span>{isLowSpots ? '🔥 الأماكن بتخلص' : 'أماكن متاحة'}</span>
                      <span>
                        باقي <b>{a.spots}</b> من {a.cap}
                      </span>
                    </div>
                    <div className="bar">
                      <i style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="foot">
                    <div className="price">
                      الاشتراك الشهري
                      <span className="num">
                        {a.price}
                        <i>ج</i>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => onNavigate('academy', { id: a.id })}
                    >
                      التفاصيل
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => onNavigate('academy', { id: a.id, subscribe: true })}
                    >
                      اشترك
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-box">
          <b>{search || activeFilter !== 'all' ? 'مفيش أكاديميات مطابقة' : 'لا توجد أكاديميات مسجلة حالياً'}</b>
          {search || activeFilter !== 'all'
            ? 'جرّب تغيّر كلمة البحث أو تشيل الفلتر.'
            : 'سيتم عرض الأكاديميات بمجرد إضافتها أو ربط قاعدة البيانات.'}
        </div>
      )}
    </main>
  );
}
