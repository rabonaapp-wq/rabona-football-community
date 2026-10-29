import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { Icon } from '../components/Icons';
import { Avatar } from '../components/Avatar';
import { PitchArt } from '../components/PitchArt';
import { PageId } from '../components/Navigation';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

interface HomeFeedProps {
  onNavigate: (page: PageId, params?: Record<string, any>) => void;
}

interface PostItem {
  id: string | number;
  authorUid?: string;
  authorPhoto?: string;
  n: string;
  t: 'academy' | 'player' | 'coach';
  s: number;
  time: string;
  txt: string;
  media?: string;
  price?: number;
  free?: string;
  badge?: [string, string, string];
  score?: [string, string, string];
  who?: string;
  likes: number;
  com: number;
  ai?: number;
  isLiked?: boolean;
}

export function HomeFeed({ onNavigate }: HomeFeedProps) {
  const { currentUser: authUser, userProfile } = useAuth();
  const [stories] = useState<{ n: string; add?: boolean; acad?: boolean; s: number; seen?: boolean }[]>([
    { n: 'قصتك', add: true, s: 0 },
  ]);

  const [posts, setPosts] = useState<PostItem[]>(() => {
    try {
      const s = JSON.parse(localStorage.getItem('rabona_posts') || '[]');
      if (Array.isArray(s)) return s;
    } catch {}
    return [];
  });
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  // Firestore Real-time listener for posts
  useEffect(() => {
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestorePosts: PostItem[] = snapshot.docs.map((d) => {
              const data = d.data();
              let formattedTime = 'الآن';
              if (data.createdAt?.toDate) {
                const diff = Math.floor((Date.now() - data.createdAt.toDate().getTime()) / 60000);
                if (diff < 1) formattedTime = 'الآن';
                else if (diff < 60) formattedTime = `منذ ${diff} دقيقة`;
                else if (diff < 1440) formattedTime = `منذ ${Math.floor(diff / 60)} ساعة`;
                else formattedTime = `منذ ${Math.floor(diff / 1440)} يوم`;
              }
              return {
                id: d.id,
                authorUid: data.authorUid,
                authorPhoto: data.authorPhoto || '',
                n: data.authorName || 'كابتن',
                t: (data.role === 'academy' ? 'academy' : data.role === 'coach' ? 'coach' : 'player') as any,
                s: 0,
                time: formattedTime,
                txt: data.text || '',
                media: data.media || '',
                score: data.score || undefined,
                likes: data.likesCount || 0,
                com: data.commentsCount || 0,
                isLiked: false,
              };
            });
            setPosts(firestorePosts);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'posts');
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore subscription not available:', e);
    }
  }, []);

  // Listen to local post changes for instantaneous rendering
  useEffect(() => {
    const handleLocalUpdate = () => {
      try {
        const s = JSON.parse(localStorage.getItem('rabona_posts') || '[]');
        if (Array.isArray(s) && s.length > 0) {
          setPosts((prev) => {
            const ids = new Set(prev.map((p) => p.id));
            const newOnes = s.filter((item: any) => !ids.has(item.id));
            return [...newOnes, ...prev];
          });
        }
      } catch {}
    };
    window.addEventListener('rabona_posts_changed', handleLocalUpdate);
    return () => window.removeEventListener('rabona_posts_changed', handleLocalUpdate);
  }, []);

  const [poppingId, setPoppingId] = useState<string | number | null>(null);

  const toggleLike = async (postId: string | number, forceTrue = false) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextLiked = forceTrue ? true : !p.isLiked;
          const diff = nextLiked && !p.isLiked ? 1 : !nextLiked && p.isLiked ? -1 : 0;
          return {
            ...p,
            isLiked: nextLiked,
            likes: Math.max(0, p.likes + diff),
          };
        }
        return p;
      })
    );

    if (typeof postId === 'string') {
      try {
        await updateDoc(doc(db, 'posts', postId), {
          likesCount: increment(forceTrue ? 1 : 1),
        });
      } catch {
        // Optimistic state handles UI seamlessly
      }
    }
  };

  const handleDeletePost = async (postId: string | number) => {
    if (typeof postId === 'string') {
      try {
        await deleteDoc(doc(db, 'posts', postId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `posts/${postId}`);
      }
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleDoubleClick = (postId: string | number) => {
    toggleLike(postId, true);
    setPoppingId(postId);
    setTimeout(() => {
      setPoppingId(null);
    }, 700);
  };

  const suggestedAcademies: { n: string; price: number; seed: number; id: number }[] = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('rabona_academies') || '[]');
      if (Array.isArray(s)) return s.slice(0, 3);
    } catch {}
    return [];
  })();

  const currentUser = authUser || (() => {
    try {
      const u = JSON.parse(localStorage.getItem('rabona_user') || 'null');
      if (u) return u;
    } catch {}
    return null;
  })();

  return (
    <div className="wrap-feed">
      {/* ── Feed Section ── */}
      <main className="feed">
        {/* Stories row */}
        <div className="stories">
          {stories.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (s.add) onNavigate('new-post');
              }}
              className={`st ${s.add ? 'add' : ''}`}
            >
              <div
                className={`ring ${s.seen ? 'seen' : ''} ${s.acad ? 'acad' : ''}`}
              >
                {s.add ? (
                  <Icon name="plus" />
                ) : (
                  <Avatar name={s.n} seed={s.s} size={64} isSquare={s.acad} />
                )}
              </div>
              <span className="n">{s.n}</span>
            </button>
          ))}
        </div>

        {/* Composer box */}
        <div className="card comp">
          <Avatar
            name={userProfile?.displayName || authUser?.displayName || authUser?.email?.split('@')[0] || 'كابتن'}
            seed={1}
            size={44}
            img={userProfile?.photoURL || authUser?.photoURL || ''}
          />
          <button
            type="button"
            onClick={() => onNavigate('new-post')}
            className="fake"
          >
            شارك صورة أو خبر عن لعبك…
          </button>
          <button
            type="button"
            onClick={() => onNavigate('new-post')}
            className="ib"
            style={{ color: 'var(--green)' }}
            aria-label="إضافة صورة"
          >
            <Icon name="plus" />
          </button>
        </div>

        {/* Section title */}
        <h2 className="h sec">آخر الأخبار</h2>

        {/* Posts list */}
        <div style={{ display: 'contents' }}>
          {posts.map((p) => (
            <article key={p.id} className="card post">
              {/* Post Header */}
              <div className="ph">
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: p.authorUid ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (p.authorUid) {
                      onNavigate('profile', { uid: p.authorUid });
                    }
                  }}
                >
                  <Avatar name={p.n} seed={p.s} size={44} isSquare={p.t === 'academy'} img={p.authorPhoto} />
                  <div>
                    <div className="n">
                      {p.n}
                      <span className={`tag ${p.t === 'player' ? 'pl' : ''}`}>
                        {p.t === 'academy' ? 'أكاديمية' : 'لاعب'}
                      </span>
                    </div>
                    <div className="m">{p.time}</div>
                  </div>
                </div>
                {p.authorUid && authUser?.uid === p.authorUid ? (
                  <button
                    type="button"
                    className="more ib"
                    aria-label="حذف المنشور"
                    title="حذف المنشور"
                    onClick={() => handleDeletePost(p.id)}
                    style={{ color: 'var(--err)' }}
                  >
                    <Icon name="trash" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="more ib"
                    aria-label="المزيد"
                  >
                    <Icon name="dots" />
                  </button>
                )}
              </div>

              {/* Post Text */}
              <p className="txt">{p.txt}</p>

              {/* Media */}
              <div
                className="media pic"
                onDoubleClick={() => handleDoubleClick(p.id)}
              >
                {p.media ? (
                  <img src={p.media} alt="" />
                ) : (
                  <PitchArt seed={p.s * 3 + (typeof p.id === 'number' ? p.id : 1)} />
                )}

                {/* Overlays */}
                {p.badge && (
                  <span className={`over tl badge ${p.badge[2]}`}>
                    <Icon name={p.badge[0]} />
                    {p.badge[1]}
                  </span>
                )}

                {p.score && (
                  <div className="over br">
                    <div className="score">
                      {p.score[0]}
                      <em>–</em>
                      {p.score[1]}
                      <small>{p.score[2]}</small>
                    </div>
                    {p.who && <div className="who">{p.who}</div>}
                  </div>
                )}

                {/* Heart Pop on Double Tap */}
                <div className={`pop ${poppingId === p.id ? 'go' : ''}`}>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z" />
                  </svg>
                </div>
              </div>

              {/* Academy Offer Banner CTA */}
              {p.t === 'academy' && (
                <div className="cta">
                  <div className="pr">
                    <small>{p.free ? 'عرض خاص' : 'الاشتراك الشهري'}</small>
                    {p.free ? (
                      <span className="free">{p.free}</span>
                    ) : (
                      <span className="num">
                        {p.price}
                        <i>ج / شهر</i>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('academy', { id: p.ai ?? 0 })}
                    className="btn"
                  >
                    اشترك الآن
                  </button>
                </div>
              )}

              {/* Like & Comments count stats */}
              <div className="stat">
                <span className="lk">{p.likes} إعجاب</span>
                <span>{p.com} تعليق</span>
              </div>

              {/* Actions Bar */}
              <div className="act">
                <button
                  type="button"
                  onClick={() => toggleLike(p.id)}
                  className={p.isLiked ? 'on' : ''}
                >
                  <Icon name="heart" />
                  إعجاب
                </button>
                <button type="button">
                  <Icon name="chat" />
                  تعليق
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                      setCopiedId(p.id);
                      setTimeout(() => setCopiedId(null), 1800);
                    }
                  }}
                >
                  <Icon name="share" />
                  {copiedId === p.id ? 'تم النسخ' : 'مشاركة'}
                </button>
              </div>
            </article>
          ))}

          {posts.length === 0 && (
            <div
              className="card"
              style={{
                padding: '48px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                marginTop: '16px',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--surface2)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--green)',
                }}
              >
                <Icon name="ball" style={{ width: 28, height: 28 }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>لا توجد منشورات حتى الآن</h3>
              <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '320px', lineHeight: 1.6 }}>
                كن أول من ينشر وشارك لحظاتك وتدريباتك مع مجتمع رابونا!
              </p>
              <button
                type="button"
                className="btn"
                onClick={() => onNavigate('new-post')}
                style={{ marginTop: '6px' }}
              >
                منشور جديد
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── Side Card ── */}
      <aside className="side card">
        {(() => {
          const displayName =
            userProfile?.displayName ||
            authUser?.displayName ||
            authUser?.email?.split('@')[0] ||
            'حسابي';
          const subTitle =
            userProfile?.role === 'academy'
              ? 'أكاديمية'
              : userProfile?.role === 'coach'
              ? 'مدرب'
              : 'لاعب';
          const photo = userProfile?.photoURL || authUser?.photoURL || '';

          return (
            <div className="mini">
              <Avatar name={displayName} seed={1} size={52} img={photo} />
              <div>
                <b>{displayName}</b>
                <small>{subTitle}</small>
              </div>
            </div>
          );
        })()}

        <div className="mst">
          <div>
            <b className="num">0</b>
            <span>ماتش</span>
          </div>
          <div>
            <b className="num">0</b>
            <span>هدف</span>
          </div>
          <div>
            <b className="num">0</b>
            <span>متابِع</span>
          </div>
        </div>

        <h3 className="h" style={{ marginInline: '14px', paddingInline: 0 }}>
          أكاديميات مقترحة
        </h3>

        <div>
          {suggestedAcademies.length > 0 ? (
            suggestedAcademies.map((a, i) => (
              <div key={i} className="sg">
                <Avatar name={a.n} seed={a.seed} size={44} isSquare />
                <div className="t">
                  {a.n}
                  <small>
                    <b>{a.price}</b> ج / شهر
                  </small>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('academy', { id: a.id })}
                  className="btn"
                >
                  عرض
                </button>
              </div>
            ))
          ) : (
            <p style={{ padding: '14px', color: 'var(--muted)', fontSize: '13px' }}>
              لا توجد أكاديميات مقترحة حالياً.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
