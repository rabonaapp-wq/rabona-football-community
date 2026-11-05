import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Icon } from '../components/Icons';
import { Avatar } from '../components/Avatar';
import { PitchArt } from '../components/PitchArt';
import { PageId } from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageCompressor';

interface ProfilePageProps {
  onNavigate: (page: PageId, params?: Record<string, any>) => void;
  viewUid?: string;
}

export function ProfilePage({ onNavigate, viewUid }: ProfilePageProps) {
  const { currentUser: authUser, userProfile, updateUserMedia, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'photos' | 'subs'>('posts');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isLoadingOther, setIsLoadingOther] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const isOwnProfile = !viewUid || (authUser && viewUid === authUser.uid);
  const targetUid = isOwnProfile ? authUser?.uid : viewUid;

  const [userPosts, setUserPosts] = useState<any[]>(() => {
    try {
      const s = JSON.parse(localStorage.getItem('rabona_posts') || '[]');
      if (Array.isArray(s) && targetUid) {
        return s.filter((p: any) => p.authorUid === targetUid);
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    if (!isOwnProfile && viewUid) {
      setIsLoadingOther(true);
      getDoc(doc(db, 'publicProfiles', viewUid))
        .then((snapshot) => {
          if (snapshot.exists()) {
            setOtherUser(snapshot.data());
          }
        })
        .catch((err) => {
          console.error('Error fetching public user profile:', err);
        })
        .finally(() => {
          setIsLoadingOther(false);
        });
    }
  }, [viewUid, isOwnProfile]);

  // Sync user posts from Firestore
  useEffect(() => {
    if (!targetUid) return;
    try {
      const q = query(
        collection(db, 'posts'),
        where('authorUid', '==', targetUid),
        limit(50)
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => {
              const data = d.data();
              let formattedTime = 'الآن';
              let ts = 0;
              if (data.createdAt?.toDate) {
                const date = data.createdAt.toDate();
                ts = date.getTime();
                const diff = Math.floor((Date.now() - ts) / 60000);
                if (diff < 1) formattedTime = 'الآن';
                else if (diff < 60) formattedTime = `منذ ${diff} دقيقة`;
                else if (diff < 1440) formattedTime = `منذ ${Math.floor(diff / 60)} ساعة`;
                else formattedTime = `منذ ${Math.floor(diff / 1440)} يوم`;
              }
              return {
                id: d.id,
                authorUid: data.authorUid,
                authorPhoto: data.authorPhoto || '',
                n: data.authorName,
                time: formattedTime,
                txt: data.text || '',
                media: data.media || '',
                score: data.score || undefined,
                likes: data.likesCount || 0,
                com: data.commentsCount || 0,
                ts,
              };
            });
            list.sort((a, b) => b.ts - a.ts);
            setUserPosts(list);
          }
        },
        () => {}
      );
      return () => unsubscribe();
    } catch {}
  }, [targetUid]);

  const cachedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('rabona_user') || 'null');
    } catch {
      return null;
    }
  })();

  const currentUser = isOwnProfile ? (userProfile || authUser || cachedUser) : otherUser;

  const displayName = isOwnProfile
    ? (userProfile?.displayName || authUser?.displayName || authUser?.email?.split('@')[0] || (
        currentUser
          ? `${currentUser.firstName || currentUser.academyName || ''} ${currentUser.lastName || ''}`.trim() || 'حسابي'
          : 'حسابي'
      ))
    : (otherUser?.displayName || 'لاعب');

  const userCity = currentUser?.address
    ? `${currentUser.address.city || ''} ${currentUser.address.governorate || ''}`.trim()
    : currentUser?.location
    ? `${currentUser.location.city || ''} ${currentUser.location.governorate || ''}`.trim()
    : currentUser?.city
    ? `${currentUser.city} ${currentUser.governorate || ''}`.trim()
    : '';

  const photoURL = isOwnProfile
    ? (userProfile?.photoURL || authUser?.photoURL || '')
    : (otherUser?.photoURL || '');

  const coverURL = isOwnProfile
    ? (userProfile?.coverURL || '')
    : (otherUser?.coverURL || '');

  const userBio = isOwnProfile
    ? (userProfile?.bio || currentUser?.bio || '')
    : (otherUser?.bio || '');

  const userRole = isOwnProfile
    ? (userProfile?.role || currentUser?.type || 'player')
    : (otherUser?.role || 'player');

  const roleLabel =
    userRole === 'academy' ? 'أكاديمية' : userRole === 'coach' ? 'مدرب' : 'لاعب';

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnProfile) return;
    try {
      const compressed = await compressImage(file, 400, 400, 0.82);
      await updateUserMedia(compressed, undefined);
    } catch (err) {
      console.error('Failed to update avatar:', err);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnProfile) return;
    try {
      const compressed = await compressImage(file, 1000, 450, 0.82);
      await updateUserMedia(undefined, compressed);
    } catch (err) {
      console.error('Failed to update cover:', err);
    }
  };

  // Collect photos from posts + profile + cover
  const galleryPhotos = [
    ...(photoURL ? [photoURL] : []),
    ...(coverURL ? [coverURL] : []),
    ...userPosts.filter((p: any) => Boolean(p.media)).map((p: any) => p.media),
  ];

  const me = {
    name: displayName,
    city: userCity,
    bio: userBio,
    number: currentUser?.number || '',
    posts: userPosts,
    photos: galleryPhotos,
    followers: 0,
    following: 0,
    season: {
      label: 'الموسم الحالي',
      matches: currentUser?.matches || 0,
      goals: currentUser?.goals || 0,
      assists: currentUser?.assists || 0,
      rating: 0,
    },
    info: [
      ['المركز', currentUser?.position || (userRole === 'coach' ? 'مدرب' : userRole === 'academy' ? 'أكاديمية' : '-')],
      ['القدم', currentUser?.foot || '-'],
    ],
    subs: [] as { id: number; n: string; price: number; next: string }[],
  };

  return (
    <main className="wrap-profile">
      <div className="colL">
        {/* Cover Photo */}
        <div
          className="cover-profile pic diag"
          role={coverURL ? 'button' : undefined}
          tabIndex={coverURL ? 0 : undefined}
          onClick={() => coverURL && setLightboxPhoto(coverURL)}
          onKeyDown={(event) => {
            if (coverURL && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              setLightboxPhoto(coverURL);
            }
          }}
          style={{ position: 'relative', overflow: 'hidden', cursor: coverURL ? 'zoom-in' : 'default' }}
        >
          {coverURL ? (
            <img
              src={coverURL}
              alt="Cover"
              className="cover-profile-image"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <PitchArt seed={21} />
          )}

          {isOwnProfile && (
            <label
              onClick={(event) => event.stopPropagation()}
              style={{
                position: 'absolute',
                insetInlineStart: '16px',
                bottom: '16px',
                zIndex: 4,
                background: 'rgba(0, 0, 0, 0.75)',
                border: '1px solid var(--line)',
                color: 'var(--white)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Icon name="pen" />
              <span>تغيير الغلاف</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleCoverUpload}
              />
            </label>
          )}

        </div>

        {/* Profile Avatar & Info */}
        <section className="head-profile">
          <div
            className="av profile-avatar"
            role={photoURL ? 'button' : undefined}
            tabIndex={photoURL ? 0 : undefined}
            onClick={() => photoURL && setLightboxPhoto(photoURL)}
            onKeyDown={(event) => {
              if (photoURL && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                setLightboxPhoto(photoURL);
              }
            }}
            aria-label={photoURL ? 'عرض الصورة الشخصية' : undefined}
            style={{ cursor: photoURL ? 'zoom-in' : 'default' }}
          >
            {photoURL ? (
              <img
                src={photoURL}
                alt={me.name}
                className="profile-avatar-image"
              />
            ) : (
              <span>{me.name.trim().charAt(0) || 'ل'}</span>
            )}

          </div>
          <span className="tag pos">{roleLabel}</span>
        </section>

        <h1 className="nm">{me.name}</h1>
        {me.city && (
          <p className="meta-profile">
            <Icon name="pin" />
            <span>{me.city}</span>
          </p>
        )}
        {me.bio && <p className="bio">{me.bio}</p>}

        <div className="stats-profile">
          <div>
            <b className="num">{me.posts.length}</b>
            <span>منشور</span>
          </div>
          <div>
            <b className="num">{me.followers}</b>
            <span>متابِع</span>
          </div>
          <div>
            <b className="num">{me.following}</b>
            <span>بيتابع</span>
          </div>
        </div>

        {isOwnProfile && (
          <div className="acts-profile">
            <button type="button" className="btn" onClick={() => onNavigate('settings')}>
              تعديل الملف الشخصي
            </button>
            <button type="button" className="btn ghost" onClick={() => onNavigate('new-post')}>
              منشور جديد
            </button>
          </div>
        )}
      </div>

      <div className="colR">
        <section className="season diag">
          <div className="top2">
            <h2 className="h">إحصائيات اللعب</h2>
            <small>{me.season.label}</small>
          </div>
          <div className="g">
            <div>
              <span className="num">{me.season.matches}</span>
              <span className="l">ماتش</span>
            </div>
            <div>
              <span className="num hi">{me.season.goals}</span>
              <span className="l">هدف</span>
            </div>
            <div>
              <span className="num">{me.season.assists}</span>
              <span className="l">تمريرة حاسمة</span>
            </div>
            <div>
              <span className="num">{me.season.rating}</span>
              <span className="l">التقييم</span>
            </div>
          </div>
        </section>

        <div className="info-profile">
          {me.info.map((i, idx) => (
            <span key={idx}>
              {i[0]}: <b>{i[1]}</b>
            </span>
          ))}
        </div>

        <div className="tabs-profile">
          <button
            type="button"
            className={activeTab === 'posts' ? 'on' : ''}
            onClick={() => setActiveTab('posts')}
          >
            المنشورات
          </button>
          <button
            type="button"
            className={activeTab === 'photos' ? 'on' : ''}
            onClick={() => setActiveTab('photos')}
          >
            الصور ({me.photos.length})
          </button>
          {isOwnProfile && (
            <button
              type="button"
              className={activeTab === 'subs' ? 'on' : ''}
              onClick={() => setActiveTab('subs')}
            >
              اشتراكاتي
            </button>
          )}
        </div>

        <div className="pane-profile">
          {activeTab === 'posts' && (
            <div>
              {me.posts.length > 0 ? (
                me.posts.map((p: any, idx: number) => (
                  <div
                    key={idx}
                    className="card"
                    style={{
                      padding: p.media ? 0 : '14px',
                      overflow: 'hidden',
                      marginBottom: '12px',
                    }}
                  >
                    {p.media && (
                      <div className="pic" style={{ height: '170px' }}>
                        <img
                          src={p.media}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div style={{ padding: p.media ? '14px' : 0 }}>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--muted)',
                          marginBottom: '6px',
                        }}
                      >
                        {p.time || 'الآن'}
                      </div>
                      <p style={{ lineHeight: 1.7, fontSize: '15px' }}>{p.txt}</p>
                      <div
                        style={{
                          display: 'flex',
                          gap: '16px',
                          marginTop: '10px',
                          fontSize: '13px',
                          color: 'var(--muted)',
                        }}
                      >
                        <span>{p.likes || 0} إعجاب</span>
                        <span>{p.com || 0} تعليق</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  className="empty"
                  style={{
                    padding: '36px 16px',
                    textAlign: 'center',
                    color: 'var(--muted)',
                    border: '1px dashed var(--line)',
                    borderRadius: '14px',
                  }}
                >
                  {isOwnProfile
                    ? 'لم تنشر أي منشورات بعد. انقر على منشور جديد للمشاركة!'
                    : 'لا توجد منشورات لهذا الحساب بعد.'}
                </div>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div>
              {me.photos.length > 0 ? (
                <div className="photos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                  {me.photos.map((src, i) => (
                    <div
                      key={i}
                      className="pic"
                      style={{
                        height: '130px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: 'var(--surface2)',
                      }}
                    >
                      <img
                        src={src}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="empty"
                  style={{
                    padding: '36px 16px',
                    textAlign: 'center',
                    color: 'var(--muted)',
                    border: '1px dashed var(--line)',
                    borderRadius: '14px',
                  }}
                >
                  لا توجد صور مضافة بعد.
                </div>
              )}
            </div>
          )}

          {activeTab === 'subs' && isOwnProfile && (
            <div>
              {me.subs.length > 0 ? (
                me.subs.map((x, idx) => (
                  <div
                    key={idx}
                    className="card subc"
                    style={{ padding: '14px', marginBottom: '12px' }}
                  >
                    <Avatar name={x.n} seed={1} size={52} isSquare />
                    <div className="x">
                      <b>{x.n}</b>
                      <span className="num">{x.price}</span> ج / شهر · {x.next}
                    </div>
                    <span className="ok">نشط</span>
                  </div>
                ))
              ) : (
                <div
                  className="empty"
                  style={{
                    padding: '36px 16px',
                    textAlign: 'center',
                    color: 'var(--muted)',
                    border: '1px dashed var(--line)',
                    borderRadius: '14px',
                  }}
                >
                  لا توجد اشتراكات نشطة حالياً.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isOwnProfile && (
        <div className="menu-profile">
          <button type="button" onClick={() => onNavigate('settings')}>
            <Icon name="gear" />
            الإعدادات
          </button>
          {userRole === 'admin' && (
            <button type="button" onClick={() => onNavigate('admin')}>
              <Icon name="whistle" />
              لوحة إدارة الأكاديمية
            </button>
          )}
          <button
            type="button"
            className="out"
            onClick={async () => {
              await signOut();
              onNavigate('login');
            }}
          >
            <Icon name="out" />
            تسجيل الخروج
          </button>
        </div>
      )}

      {lightboxPhoto && (
        <div
          className="photo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="عرض الصورة"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            type="button"
            className="photo-lightbox-close"
            onClick={() => setLightboxPhoto(null)}
            aria-label="إغلاق الصورة"
          >
            ×
          </button>
          <img
            src={lightboxPhoto}
            alt={me.name}
            className="photo-lightbox-image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
