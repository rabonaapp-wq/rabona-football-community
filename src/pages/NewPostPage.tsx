import React, { useState, useRef } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Icon } from '../components/Icons';
import { Avatar } from '../components/Avatar';
import { PageId } from '../components/Navigation';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { compressImage } from '../utils/imageCompressor';

interface NewPostPageProps {
  onNavigate: (page: PageId, params?: Record<string, any>) => void;
}

export function NewPostPage({ onNavigate }: NewPostPageProps) {
  const { currentUser: authUser, userProfile } = useAuth();
  const [text, setText] = useState('');
  const [audience, setAudience] = useState('all');
  const [images, setImages] = useState<{ id: string; url: string; name: string }[]>([]);
  const [showScore, setShowScore] = useState(false);
  const [scoreUs, setScoreUs] = useState('');
  const [scoreThem, setScoreThem] = useState('');
  const [competition, setCompetition] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 4;
  const MAX_CHARS = 500;
  const emojis = ['⚽', '🔥', '👏', '💪', '🏆'];

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList = Array.from(e.target.files);
    let newItems = [...images];
    let err = '';

    for (const f of fileList) {
      if (newItems.length >= MAX_IMAGES) {
        err = `أقصى عدد صور ${MAX_IMAGES}.`;
        break;
      }
      if (!f.type.startsWith('image/')) {
        err = `"${f.name}" ليست صورة.`;
        continue;
      }
      try {
        const compressed = await compressImage(f, 1200, 1200, 0.82);
        newItems.push({ id: Math.random().toString(), url: compressed, name: f.name });
      } catch {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const dataUrl = uploadEvent.target?.result as string;
          setImages((prev) => [
            ...prev,
            { id: Math.random().toString(), url: dataUrl, name: f.name }
          ]);
        };
        reader.readAsDataURL(f);
      }
    }

    setImages(newItems);
    setErrorMessage(err);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePublish = async () => {
    if (!text.trim() && images.length === 0) {
      setErrorMessage('اكتب حاجة أو ضيف صورة.');
      return;
    }

    if (showScore) {
      const u = Number(scoreUs);
      const t = Number(scoreThem);
      if (
        scoreUs === '' ||
        scoreThem === '' ||
        isNaN(u) ||
        isNaN(t) ||
        u < 0 ||
        u > 99 ||
        t < 0 ||
        t > 99
      ) {
        setErrorMessage('اكتب نتيجة الماتش بأرقام من 0 لـ 99.');
        return;
      }
    }

    const authorUid = authUser?.uid || '';
    if (!authorUid) {
      setErrorMessage('يجب تسجيل الدخول لنشر منشور.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    const authorName =
      userProfile?.displayName ||
      authUser?.displayName ||
      authUser?.email?.split('@')[0] ||
      'كابتن';
    const authorPhoto = userProfile?.photoURL || authUser?.photoURL || '';
    const role = userProfile?.role || 'player';

    const postId = `post_${Date.now()}`;
    const newPostData = {
      id: postId,
      authorUid,
      authorName,
      authorPhoto,
      role,
      text: text.trim(),
      media: images[0]?.url || '',
      score: showScore ? [scoreUs, scoreThem, competition || 'مباراة'] : null,
      likesCount: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'posts', postId), newPostData);

      // Cache locally for instant UI update
      const localPost = {
        id: postId,
        authorUid,
        authorPhoto,
        n: authorName,
        t: role as any,
        s: 0,
        time: 'الآن',
        txt: text.trim(),
        media: images[0]?.url || '',
        score: showScore ? [scoreUs, scoreThem, competition || 'مباراة'] : undefined,
        likes: 0,
        com: 0,
        isLiked: false,
      };
      const existing = JSON.parse(localStorage.getItem('rabona_posts') || '[]');
      localStorage.setItem('rabona_posts', JSON.stringify([localPost, ...existing]));
      window.dispatchEvent(new Event('rabona_posts_changed'));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `posts/${postId}`);
    } finally {
      setIsSubmitting(false);
      setIsPublished(true);
    }
  };

  const resetForm = () => {
    setText('');
    setImages([]);
    setShowScore(false);
    setScoreUs('');
    setScoreThem('');
    setCompetition('');
    setAllowComments(true);
    setErrorMessage('');
    setIsPublished(false);
  };

  return (
    <main style={{ maxWidth: '640px', margin: 'auto', padding: '18px 16px calc(var(--bar) + 32px + env(safe-area-inset-bottom))' }}>
      {!isPublished ? (
        <section id="form">
          <h1 className="h" style={{ fontSize: '24px', marginBottom: '14px' }}>منشور جديد</h1>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '16px', padding: '14px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {(() => {
                const displayName =
                  userProfile?.displayName ||
                  authUser?.displayName ||
                  authUser?.email?.split('@')[0] ||
                  'حسابي';
                const photo = userProfile?.photoURL || authUser?.photoURL || '';
                return (
                  <>
                    <Avatar name={displayName} seed={1} size={44} img={photo} />
                    <div>
                      <b style={{ display: 'block' }}>{displayName}</b>
                      <small style={{ color: 'var(--muted)', fontSize: '12.5px' }}>بتنشر دلوقتي</small>
                    </div>
                  </>
                );
              })()}

              <select
                id="aud"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                aria-label="مين يشوف المنشور"
                style={{ marginInlineStart: 'auto', height: '36px', borderRadius: '10px', background: 'var(--surface2)', border: '1px solid var(--line)', padding: '0 10px', fontSize: '14px' }}
              >
                <option value="all">الكل</option>
                <option value="fol">المتابعين</option>
                <option value="me">أنا بس</option>
              </select>
            </div>

            {/* Textarea */}
            <textarea
              id="txt"
              maxLength={MAX_CHARS}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="شارك صورة أو خبر عن لعبك يا كابتن…"
              aria-label="نص المنشور"
              style={{ color: 'var(--white)', width: '100%', minHeight: '130px', resize: 'none', background: 'none', border: 0, outline: 0, fontSize: '17px', lineHeight: 1.8, marginTop: '12px' }}
            />

            {/* Counter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '12.5px' }}>
              <span style={{ color: 'var(--green)' }}>مسودة محفوظة</span>
              <span className={`num ${text.length >= 450 ? 'warn' : ''}`}>
                {text.length} / {MAX_CHARS}
              </span>
            </div>

            {/* Images Grid */}
            {images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '12px' }}>
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', background: 'var(--surface2)' }}
                  >
                    <img
                      src={img.url}
                      alt={`صورة ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      style={{ position: 'absolute', top: '6px', insetInlineStart: '6px', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(0,0,0,.7)', fontSize: '18px', lineHeight: 1, color: '#fff' }}
                      aria-label={`حذف الصورة ${idx + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              hidden
            />

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--line)', marginTop: '12px', paddingTop: '12px' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ height: '38px', padding: '0 14px', borderRadius: '19px', background: 'var(--surface2)', border: '1px solid var(--line)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}
              >
                <Icon name="plus" style={{ width: '18px', height: '18px', color: 'var(--green)' }} />
                صور <span className="num" style={{ fontSize: '12px' }}>{images.length}/{MAX_IMAGES}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowScore(!showScore)}
                style={{
                  height: '38px',
                  padding: '0 14px',
                  borderRadius: '19px',
                  background: 'var(--surface2)',
                  border: showScore ? '1px solid var(--green)' : '1px solid var(--line)',
                  color: showScore ? 'var(--green)' : 'var(--white)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                }}
              >
                <Icon name="ball" style={{ width: '18px', height: '18px', color: 'var(--green)' }} />
                نتيجة ماتش
              </button>

              <span style={{ flex: 1 }} />

              {/* Emoji quick bar */}
              <div>
                {emojis.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => handleEmojiClick(e)}
                    style={{ fontSize: '20px', width: '38px', height: '38px', borderRadius: '50%' }}
                    aria-label={e}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Score */}
            {showScore && (
              <div style={{ marginTop: '12px', background: 'var(--surface2)', borderRadius: '12px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                  <label style={{ display: 'grid', gap: '4px', textAlign: 'center', color: 'var(--muted)', fontSize: '12.5px' }}>
                    ليهم
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={scoreThem}
                      onChange={(e) => setScoreThem(e.target.value)}
                      style={{ width: '72px', height: '56px', textAlign: 'center', fontSize: '26px', borderRadius: '12px', background: 'var(--surface)', border: '1.5px solid var(--line)', outline: 0, direction: 'ltr' }}
                    />
                  </label>
                  <em style={{ fontStyle: 'normal', color: 'var(--green)', fontSize: '24px', marginTop: '18px' }}>–</em>
                  <label style={{ display: 'grid', gap: '4px', textAlign: 'center', color: 'var(--muted)', fontSize: '12.5px' }}>
                    لينا
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={scoreUs}
                      onChange={(e) => setScoreUs(e.target.value)}
                      style={{ width: '72px', height: '56px', textAlign: 'center', fontSize: '26px', borderRadius: '12px', background: 'var(--surface)', border: '1.5px solid var(--line)', outline: 0, direction: 'ltr' }}
                    />
                  </label>
                </div>

                <input
                  type="text"
                  maxLength={30}
                  value={competition}
                  onChange={(e) => setCompetition(e.target.value)}
                  placeholder="البطولة (اختياري) مثال: دوري الناشئين"
                  aria-label="البطولة"
                  style={{ width: '100%', marginTop: '10px', height: '42px', borderRadius: '12px', background: 'var(--surface)', border: '1.5px solid var(--line)', padding: '0 12px', outline: 0, fontSize: '15px' }}
                />
              </div>
            )}

            {/* Allow Comments */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0 0' }}>
              <div style={{ flex: 1 }}>
                <b style={{ display: 'block', fontSize: '14px' }}>السماح بالتعليقات</b>
                <small style={{ display: 'block', color: 'var(--muted)', fontSize: '12.5px' }}>
                  {allowComments ? 'اللي يقدر يعلّق حسب إعدادات الخصوصية' : 'التعليقات مقفولة على المنشور ده'}
                </small>
              </div>

              <button
                type="button"
                role="switch"
                className="sw"
                aria-checked={allowComments}
                onClick={() => setAllowComments(!allowComments)}
              />
            </div>

            {errorMessage && (
              <p style={{ color: 'var(--err)', fontSize: '13.5px', marginTop: '12px' }}>
                {errorMessage}
              </p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn ghost"
                style={{ flex: 1 }}
                onClick={() => onNavigate('home')}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn"
                style={{ flex: 1 }}
                disabled={isSubmitting || (!text.trim() && images.length === 0)}
                onClick={handlePublish}
              >
                {isSubmitting ? 'بينشر…' : 'انشر'}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section style={{ textAlign: 'center', padding: '50px 10px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--green)', color: '#04170B', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
            <svg viewBox="0 0 24 24" style={{ width: '36px', height: '36px', stroke: 'currentColor', fill: 'none', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
              <path d="m5 12 5 5 9-10" />
            </svg>
          </div>
          <h1 className="h" style={{ justifyContent: 'center', fontSize: '24px' }}>اتنشر منشورك</h1>
          <p style={{ color: 'var(--muted)', margin: '6px 0 20px' }}>هيظهر لمتابعينك دلوقتي.</p>
          <div style={{ display: 'flex', gap: '10px', maxWidth: '360px', margin: 'auto' }}>
            <button
              type="button"
              className="btn"
              style={{ flex: 1 }}
              onClick={() => onNavigate('home')}
            >
              الرئيسية
            </button>
            <button
              type="button"
              className="btn ghost"
              style={{ flex: 1 }}
              onClick={resetForm}
            >
              منشور تاني
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
