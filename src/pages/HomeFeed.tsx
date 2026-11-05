import React, { useRef, useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  deleteDoc,
  doc,
  runTransaction,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { Icon } from '../components/Icons';
import { Avatar } from '../components/Avatar';
import { PitchArt } from '../components/PitchArt';
import { PageId } from '../components/Navigation';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { compressImage } from '../utils/imageCompressor';

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
  mediaUrls?: string[];
  who?: string;
  likes: number;
  com: number;
  ai?: number;
  isLiked?: boolean;
}

interface CommentItem {
  id: string;
  postId: string | number;
  authorUid?: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  createdAt: string;
}

interface OwnStory {
  image: string;
  seen: boolean;
  expiresAt?: number;
}

interface StoryItem {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string;
  image: string;
  createdAt?: number;
  expiresAt?: number;
}

export function HomeFeed({ onNavigate }: HomeFeedProps) {
  const { currentUser: authUser, userProfile } = useAuth();
  const storyUploadRef = useRef<HTMLInputElement>(null);
  const [ownStory, setOwnStory] = useState<OwnStory | null>(null);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [storyDraft, setStoryDraft] = useState<string | null>(null);
  const [isPublishingStory, setIsPublishingStory] = useState(false);

  const [posts, setPosts] = useState<PostItem[]>(() => {
    try {
      const s = JSON.parse(localStorage.getItem('rabona_posts') || '[]');
      if (Array.isArray(s)) return s;
    } catch {}
    return [];
  });

  const [poppingId, setPoppingId] = useState<string | number | null>(null);

  // Comments state
  const [activeCommentPost, setActiveCommentPost] = useState<PostItem | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem('rabona_post_comments') || '{}');
    } catch {
      return {};
    }
  });
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    const postId = activeCommentPost?.id;
    if (typeof postId !== 'string') return;

    const commentsQuery = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc'),
      limit(20)
    );
    return onSnapshot(
      commentsQuery,
      (snapshot) => {
        const comments: CommentItem[] = snapshot.docs.map((commentDoc) => {
          const data = commentDoc.data();
          const createdAt = data.createdAt?.toDate?.();
          return {
            id: commentDoc.id,
            postId,
            authorUid: data.authorUid || '',
            authorName: data.authorName || 'كابتن',
            authorPhoto: data.authorPhoto || '',
            text: data.text || '',
            createdAt: createdAt
              ? createdAt.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
              : 'الآن',
          };
        });
        setCommentsMap((previous) => ({ ...previous, [postId]: comments }));
      },
      (error) => {
        console.error(`Unable to load comments for posts/${postId}:`, error);
      }
    );
  }, [activeCommentPost?.id]);

  // Share state
  const [sharePost, setSharePost] = useState<PostItem | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [openPostMenu, setOpenPostMenu] = useState<string | number | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | number | null>(null);
  const [editingPostText, setEditingPostText] = useState('');
  const [isSavingPost, setIsSavingPost] = useState(false);

  useEffect(() => {
    if (!shareToast) return;
    const timeoutId = window.setTimeout(() => setShareToast(null), 2300);
    return () => window.clearTimeout(timeoutId);
  }, [shareToast]);

  const likeStorageKey = (postId: string | number) =>
    `rabona_likes_${authUser?.uid || 'guest'}_${postId}`;

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
                mediaUrls: Array.isArray(data.mediaUrls) ? data.mediaUrls : data.media ? [data.media] : [],
                score: data.score || undefined,
                likes: data.likesCount || 0,
                com: data.commentsCount || 0,
                isLiked: localStorage.getItem(likeStorageKey(d.id)) === '1',
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

  const toggleLike = async (postId: string | number, forceTrue = false) => {
    const currentPost = posts.find((post) => post.id === postId);
    if (!currentPost) return;

    const nextLiked = forceTrue ? !currentPost.isLiked : !currentPost.isLiked;
    const diff = nextLiked ? 1 : -1;
    const storageKey = likeStorageKey(postId);

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: nextLiked,
            likes: Math.max(0, p.likes + diff),
          };
        }
        return p;
      })
    );
    if (nextLiked) localStorage.setItem(storageKey, '1');
    else localStorage.removeItem(storageKey);

    if (typeof postId === 'string') {
      try {
        if (!authUser) {
          throw new Error('يجب تسجيل الدخول للإعجاب بالمنشور.');
        }

        const postRef = doc(db, 'posts', postId);
        const likeRef = doc(db, 'posts', postId, 'likes', authUser.uid);
        await runTransaction(db, async (transaction) => {
          const [postSnapshot, likeSnapshot] = await Promise.all([
            transaction.get(postRef),
            transaction.get(likeRef),
          ]);
          if (!postSnapshot.exists()) throw new Error('المنشور غير موجود.');

          const alreadyLiked = likeSnapshot.exists();
          if (alreadyLiked === nextLiked) return;

          transaction.update(postRef, {
            likesCount: Math.max(0, (postSnapshot.data().likesCount || 0) + diff),
          });
          if (nextLiked) {
            transaction.set(likeRef, { userId: authUser.uid, createdAt: serverTimestamp() });
          } else {
            transaction.delete(likeRef);
          }
        });
      } catch (error) {
        localStorage.setItem(storageKey, currentPost.isLiked ? '1' : '');
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, isLiked: currentPost.isLiked, likes: currentPost.likes }
              : p
          )
        );
        console.error('Unable to toggle post like:', error);
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
    setOpenPostMenu(null);
  };

  const handleStartEditingPost = (post: PostItem) => {
    setEditingPostId(post.id);
    setEditingPostText(post.txt);
    setOpenPostMenu(null);
  };

  const handleSaveEditedPost = async (post: PostItem) => {
    const text = editingPostText.trim();
    if (!text || isSavingPost) return;

    setIsSavingPost(true);
    try {
      if (typeof post.id === 'string') {
        await updateDoc(doc(db, 'posts', post.id), {
          text,
          updatedAt: serverTimestamp(),
        });
      }
      setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, txt: text } : item)));
      const localPosts = JSON.parse(localStorage.getItem('rabona_posts') || '[]');
      if (Array.isArray(localPosts)) {
        localStorage.setItem(
          'rabona_posts',
          JSON.stringify(localPosts.map((item: PostItem) => (item.id === post.id ? { ...item, txt: text } : item)))
        );
      }
      setEditingPostId(null);
      setShareToast('تم تعديل المنشور بنجاح.');
    } catch (error) {
      console.error(`Unable to edit posts/${post.id}:`, error);
      setShareToast('تعذر تعديل المنشور. حاول مرة أخرى.');
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleSavePost = (postId: string | number) => {
    const savedPosts = JSON.parse(localStorage.getItem('rabona_saved_posts') || '[]');
    const savedIds = Array.isArray(savedPosts) ? savedPosts : [];
    const isSaved = savedIds.includes(postId);
    const nextSavedIds = isSaved ? savedIds.filter((id) => id !== postId) : [...savedIds, postId];
    localStorage.setItem('rabona_saved_posts', JSON.stringify(nextSavedIds));
    setOpenPostMenu(null);
    setShareToast(isSaved ? 'تمت إزالة المنشور من المحفوظات.' : 'تم حفظ المنشور.');
  };

  const handleDoubleClick = (postId: string | number) => {
    toggleLike(postId, true);
    setPoppingId(postId);
    setTimeout(() => {
      setPoppingId(null);
    }, 700);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeCommentPost) return;
    if (!authUser) {
      setShareFeedback('يجب تسجيل الدخول لكتابة تعليق.');
      return;
    }
    setIsSubmittingComment(true);

    const authorName = userProfile?.displayName || authUser?.displayName || authUser?.email?.split('@')[0] || 'كابتن';
    const authorPhoto = userProfile?.photoURL || authUser?.photoURL || '';
    const postId = String(activeCommentPost.id);

    try {
      const postRef = doc(db, 'posts', postId);
      const commentsRef = collection(db, 'posts', postId, 'comments');
      await runTransaction(db, async (transaction) => {
        const postSnapshot = await transaction.get(postRef);
        if (!postSnapshot.exists()) throw new Error('المنشور غير موجود.');

        const commentRef = doc(commentsRef);
        transaction.set(commentRef, {
          authorUid: authUser.uid,
          authorName,
          authorPhoto,
          text: newCommentText.trim(),
          parentCommentId: null,
          likesCount: 0,
          createdAt: serverTimestamp(),
        });
        transaction.update(postRef, {
          commentsCount: (postSnapshot.data().commentsCount || 0) + 1,
        });
      });

      setPosts((prev) =>
        prev.map((p) => (p.id === activeCommentPost.id ? { ...p, com: p.com + 1 } : p))
      );
      setActiveCommentPost((prev) => (prev ? { ...prev, com: prev.com + 1 } : null));
      setNewCommentText('');
    } catch (error) {
      console.error(`Unable to add comment to posts/${postId}:`, error);
      setShareFeedback('تعذر نشر التعليق. حاول مرة أخرى.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleRepostOnRabona = async (p: PostItem) => {
    if (!authUser) {
      setShareFeedback('يجب تسجيل الدخول أولاً للمشاركة.');
      setTimeout(() => setShareFeedback(null), 2500);
      return;
    }

    const postId = `post_${Date.now()}`;
    const authorName = userProfile?.displayName || authUser?.displayName || authUser?.email?.split('@')[0] || 'كابتن';
    const authorPhoto = userProfile?.photoURL || authUser?.photoURL || '';
    const role = userProfile?.role || 'player';
    const repostText = `🔄 مشاركة منشور من ${p.n}:\n"${p.txt}"`;

    const newPostData = {
      id: postId,
      authorUid: authUser.uid,
      authorName,
      authorPhoto,
      role,
      text: repostText,
      media: p.media || '',
      mediaUrls: p.mediaUrls || (p.media ? [p.media] : []),
      likesCount: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'posts', postId), newPostData);
      const localPost: PostItem = {
        id: postId,
        authorUid: authUser.uid,
        authorPhoto,
        n: authorName,
        t: role as any,
        s: 0,
        time: 'الآن',
        txt: repostText,
        media: p.media || '',
        likes: 0,
        com: 0,
        isLiked: false,
      };
      const existing = JSON.parse(localStorage.getItem('rabona_posts') || '[]');
      localStorage.setItem('rabona_posts', JSON.stringify([localPost, ...existing]));
      window.dispatchEvent(new Event('rabona_posts_changed'));

      setSharePost(null);
      setShareToast('تمت مشاركة المنشور على صفحتك بنجاح!');
    } catch {
      setShareFeedback('حدث خطأ أثناء المشاركة.');
      setTimeout(() => setShareFeedback(null), 2000);
    }
  };

  const handleShareWhatsApp = (p: PostItem) => {
    const textToShare = `شاهد منشور ${p.n} على منصة رابونا لكرة القدم:\n"${p.txt}"\n${window.location.origin}/#home`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`;
    window.open(whatsappUrl, '_blank');
    setSharePost(null);
    setShareToast('تم فتح واتساب لمشاركة المنشور.');
  };

  const handleCopyPostLink = () => {
    const postUrl = `${window.location.origin}/#home`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      setSharePost(null);
      setShareToast('تم نسخ رابط المنشور بنجاح!');
    }
  };

  const handleNativeShare = async (p: PostItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `منشور ${p.n} على رابونا`,
          text: p.txt,
          url: `${window.location.origin}/#home`,
        });
        setSharePost(null);
        setShareToast('تمت مشاركة المنشور بنجاح!');
      } catch {}
    } else {
      handleCopyPostLink();
    }
  };

  const suggestedAcademies: { n: string; price: number; seed: number; id: number }[] = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('rabona_academies') || '[]');
      if (Array.isArray(s)) return s.slice(0, 3);
    } catch {}
    return [];
  })();

  const activeDisplayName =
    userProfile?.displayName || authUser?.displayName || authUser?.email?.split('@')[0] || 'حسابي';
  const activePhoto = userProfile?.photoURL || authUser?.photoURL || '';
  const storyStorageKey = `rabona_story_${authUser?.uid || userProfile?.uid || 'guest'}`;

  useEffect(() => {
    try {
      const savedStory = JSON.parse(localStorage.getItem(storyStorageKey) || 'null');
      setOwnStory(
        savedStory?.image && savedStory.expiresAt > Date.now()
          ? savedStory
          : null
      );
    } catch (error) {
      console.error('Unable to load story:', error);
      setOwnStory(null);
    }
  }, [storyStorageKey]);

  useEffect(() => {
    const storiesQuery = query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(
      storiesQuery,
      (snapshot) => {
        setStories(
          snapshot.docs
            .map((storyDoc) => {
              const data = storyDoc.data();
              return {
                id: storyDoc.id,
                authorUid: data.authorUid || storyDoc.id,
                authorName: data.authorName || 'لاعب',
                authorPhoto: data.authorPhoto || '',
                image: data.image || '',
                createdAt: data.createdAt?.toDate?.()?.getTime(),
                expiresAt: data.expiresAt?.toDate?.()?.getTime(),
              };
            })
            .filter(
              (story) =>
                story.image &&
                story.expiresAt
                  ? story.expiresAt > Date.now()
                  : Boolean(story.createdAt && story.createdAt > Date.now() - 24 * 60 * 60 * 1000)
            )
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'stories');
      }
    );
  }, []);

  const handleStoryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const image = await compressImage(file, 720, 1280, 0.8);
      setStoryDraft(image);
    } catch (error) {
      console.error('Unable to upload story:', error);
    }
  };

  const publishStory = async () => {
    if (!storyDraft || isPublishingStory) return;
    const uid = authUser?.uid || userProfile?.uid;
    if (!uid) {
      console.error('Unable to publish story: user is not signed in.');
      return;
    }

    setIsPublishingStory(true);
    try {
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      const nextStory = { image: storyDraft, seen: false, expiresAt };
      await setDoc(doc(db, 'stories', uid), {
        id: uid,
        authorUid: uid,
        authorName: activeDisplayName,
        authorPhoto: activePhoto,
        image: storyDraft,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(expiresAt),
        updatedAt: serverTimestamp(),
      });
      localStorage.setItem(storyStorageKey, JSON.stringify(nextStory));
      setOwnStory(nextStory);
      setStoryDraft(null);
    } catch (error) {
      console.error('Unable to publish story:', error);
    } finally {
      setIsPublishingStory(false);
    }
  };

  const markStorySeen = (story: StoryItem) => {
    if (story.authorUid === authUser?.uid) {
      const seenStory = { image: story.image, seen: true };
      localStorage.setItem(storyStorageKey, JSON.stringify(seenStory));
      setOwnStory(seenStory);
      return;
    }

    localStorage.setItem(`rabona_story_seen_${authUser?.uid || 'guest'}_${story.id}`, '1');
  };

  const handleStoryClick = (story?: StoryItem) => {
    if (story) {
      markStorySeen(story);
      setActiveStory(story);
      return;
    }
    if (!ownStory) {
      onNavigate('profile');
      return;
    }
    const seenStory = { ...ownStory, seen: true };
    localStorage.setItem(storyStorageKey, JSON.stringify(seenStory));
    setOwnStory(seenStory);
  };

  const ownRemoteStory = stories.find(
    (story) => story.authorUid === authUser?.uid || story.authorUid === userProfile?.uid
  );
  const storyCards = [
    ...(ownRemoteStory
      ? [ownRemoteStory]
      : ownStory
        ? [{
            id: authUser?.uid || userProfile?.uid || 'guest',
            authorUid: authUser?.uid || userProfile?.uid || 'guest',
            authorName: activeDisplayName,
            authorPhoto: activePhoto,
            image: ownStory.image,
          }]
        : []),
    ...stories.filter((story) => story.authorUid !== (authUser?.uid || userProfile?.uid)),
  ];
  const activeStoryIndex = activeStory
    ? storyCards.findIndex((story) => story.id === activeStory.id)
    : -1;

  const moveStory = (direction: -1 | 1) => {
    const nextIndex = activeStoryIndex + direction;
    if (nextIndex < 0 || nextIndex >= storyCards.length) {
      setActiveStory(null);
      return;
    }
    const nextStory = storyCards[nextIndex];
    markStorySeen(nextStory);
    setActiveStory(nextStory);
  };

  useEffect(() => {
    if (!activeStory) return;
    const timer = window.setTimeout(() => moveStory(1), 10000);
    return () => window.clearTimeout(timer);
  }, [activeStory?.id, activeStoryIndex]);

  return (
    <div className="wrap-feed">
      {/* ── Feed Section ── */}
      <main className="feed">
        {/* Stories row */}
        <div className="stories">
          {storyCards.map((story) => {
            const isOwnStory = story.authorUid === (authUser?.uid || userProfile?.uid);
            const seen = isOwnStory
              ? Boolean(ownStory?.seen)
              : localStorage.getItem(`rabona_story_seen_${authUser?.uid || 'guest'}_${story.id}`) === '1';

            return (
              <button
                type="button"
                key={story.id}
                onClick={() => handleStoryClick(story)}
                className="st"
                title={isOwnStory ? 'مشاهدة قصتك' : `مشاهدة ستوري ${story.authorName}`}
              >
                <div className={`ring ${seen ? 'seen' : ''}`}>
                  <Avatar name={story.authorName} seed={1} size={64} img={story.image || story.authorPhoto} />
                  {isOwnStory && (
                    <span
                      className="story-add"
                      role="button"
                      tabIndex={0}
                      aria-label="إضافة ستوري"
                      onClick={(event) => {
                        event.stopPropagation();
                        storyUploadRef.current?.click();
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          storyUploadRef.current?.click();
                        }
                      }}
                    >
                      +
                    </span>
                  )}
                </div>
                <span className="n">{isOwnStory ? 'قصتك' : story.authorName}</span>
              </button>
            );
          })}
          {!storyCards.length && (
            <button type="button" onClick={() => onNavigate('profile')} className="st" title="عرض ملفي الشخصي">
              <div className="ring empty">
                <Avatar name={activeDisplayName} seed={1} size={64} img={activePhoto} />
                <span
                  className="story-add"
                  role="button"
                  tabIndex={0}
                  aria-label="إضافة ستوري"
                  onClick={(event) => {
                    event.stopPropagation();
                    storyUploadRef.current?.click();
                  }}
                >
                  +
                </span>
              </div>
              <span className="n">قصتك</span>
            </button>
          )}
          <input
            ref={storyUploadRef}
            type="file"
            accept="image/*"
            onChange={handleStoryUpload}
            hidden
          />
        </div>

        {activeStory && (
          <div
            className="story-viewer"
            role="dialog"
            aria-modal="true"
            onClick={(event) => {
              if (event.target === event.currentTarget) setActiveStory(null);
            }}
          >
            <div className="story-viewer-card">
              <div className="story-progress">
                {storyCards.map((story) => (
                  <span key={story.id} className={story.id === activeStory.id ? 'active' : ''} />
                ))}
              </div>
              <button type="button" className="story-close" onClick={() => setActiveStory(null)} aria-label="إغلاق الستوري">
                ×
              </button>
              <button type="button" className="story-nav story-nav-prev" onClick={() => moveStory(-1)} aria-label="الستوري السابقة">
                ‹
              </button>
              <button type="button" className="story-nav story-nav-next" onClick={() => moveStory(1)} aria-label="الستوري التالية">
                ›
              </button>
              <div className="story-viewer-head">
                <Avatar name={activeStory.authorName} seed={1} size={38} img={activeStory.authorPhoto} />
                <b>{activeStory.authorName}</b>
                <small>الآن</small>
              </div>
              <img src={activeStory.image} alt={`ستوري ${activeStory.authorName}`} className="story-viewer-image" />
            </div>
          </div>
        )}

        {storyDraft && (
          <div className="story-editor-backdrop" role="dialog" aria-modal="true">
            <div className="story-editor">
              <div className="story-editor-top">
                <button type="button" onClick={() => setStoryDraft(null)} aria-label="إلغاء">
                  ×
                </button>
                <strong>معاينة الستوري</strong>
                <span>1/1</span>
              </div>
              <div className="story-editor-stage">
                <img src={storyDraft} alt="معاينة الستوري" />
                <div className="story-editor-badge">قصتك على رابونا</div>
              </div>
              <div className="story-editor-actions">
                <button type="button" className="story-change" onClick={() => storyUploadRef.current?.click()}>
                  تغيير الصورة
                </button>
                <button type="button" className="story-publish" onClick={publishStory} disabled={isPublishingStory}>
                  {isPublishingStory ? 'جاري النشر...' : 'نشر الستوري'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Composer box */}
        <div className="card comp">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
            title="عرض ملفي الشخصي"
          >
            <Avatar
              name={activeDisplayName}
              seed={1}
              size={44}
              img={activePhoto}
            />
          </button>
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
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                  onClick={() => {
                    if (p.authorUid && p.authorUid !== authUser?.uid) {
                      onNavigate('profile', { uid: p.authorUid });
                    } else {
                      onNavigate('profile');
                    }
                  }}
                  title="عرض الملف الشخصي"
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
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="more ib"
                    aria-label="خيارات المنشور"
                    aria-expanded={openPostMenu === p.id}
                    onClick={() => setOpenPostMenu((current) => (current === p.id ? null : p.id))}
                  >
                    <Icon name="dots" />
                  </button>
                  {openPostMenu === p.id && (
                    <div
                      role="menu"
                      style={{
                        position: 'absolute',
                        top: '44px',
                        insetInlineEnd: 0,
                        zIndex: 5,
                        minWidth: '150px',
                        padding: '6px',
                        border: '1px solid var(--line)',
                        borderRadius: '12px',
                        background: 'var(--surface2)',
                        boxShadow: '0 10px 24px rgba(0,0,0,.35)',
                      }}
                    >
                      {p.authorUid && authUser?.uid === p.authorUid && (
                        <>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => handleStartEditingPost(p)}
                            style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'right', color: 'var(--white)' }}
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              handleDeletePost(p.id);
                            }}
                            style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'right', color: 'var(--err)' }}
                          >
                            حذف
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleSavePost(p.id)}
                        style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'right', color: 'var(--white)' }}
                      >
                        حفظ
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Post Text */}
              {editingPostId === p.id ? (
                <div style={{ display: 'grid', gap: '8px', marginBottom: '14px' }}>
                  <textarea
                    value={editingPostText}
                    onChange={(event) => setEditingPostText(event.target.value)}
                    maxLength={500}
                    rows={4}
                    autoFocus
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--line)', borderRadius: '10px', background: 'var(--surface2)', resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                    <button type="button" className="btn" onClick={() => handleSaveEditedPost(p)} disabled={isSavingPost}>
                      {isSavingPost ? 'جاري الحفظ...' : 'حفظ التعديل'}
                    </button>
                    <button type="button" className="btn ghost" onClick={() => setEditingPostId(null)}>
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <p className="txt">{p.txt}</p>
              )}

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
                  <svg viewBox="0 0 24 24" style={{ fill: 'var(--green)', stroke: 'var(--green)' }}>
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
                <span
                  className="lk"
                  onClick={() => toggleLike(p.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {p.likes} إعجاب
                </span>
                <span
                  onClick={() => setActiveCommentPost(p)}
                  style={{ cursor: 'pointer' }}
                >
                  {p.com} تعليق
                </span>
              </div>

              {/* Actions Bar */}
              <div className="act">
                <button
                  type="button"
                  onClick={() => toggleLike(p.id)}
                  className={p.isLiked ? 'on' : ''}
                  style={p.isLiked ? { color: 'var(--green)' } : {}}
                >
                  <Icon
                    name="heart"
                    style={p.isLiked ? { fill: 'var(--green)', stroke: 'var(--green)', color: 'var(--green)' } : {}}
                  />
                  {p.isLiked ? 'أعجبني' : 'إعجاب'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCommentPost(p)}
                >
                  <Icon name="chat" />
                  تعليق
                </button>
                <button
                  type="button"
                  onClick={() => setSharePost(p)}
                >
                  <Icon name="share" />
                  مشاركة
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
        <div
          className="mini"
          onClick={() => onNavigate('profile')}
          style={{ cursor: 'pointer' }}
          title="عرض ملفي الشخصي"
        >
          <Avatar name={activeDisplayName} seed={1} size={52} img={activePhoto} />
          <div>
            <b>{activeDisplayName}</b>
            <small>
              {userProfile?.role === 'academy'
                ? 'أكاديمية'
                : userProfile?.role === 'coach'
                ? 'مدرب'
                : 'لاعب'}
            </small>
          </div>
        </div>

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

        <h3 className="h" style={{ marginTop: '20px', fontSize: '15px' }}>أكاديميات مقترحة</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          {suggestedAcademies.map((a) => (
            <div
              key={a.id}
              onClick={() => onNavigate('academy', { id: a.id })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px',
                borderRadius: '10px',
                background: 'var(--surface2)',
                cursor: 'pointer',
              }}
            >
              <Avatar name={a.n} seed={a.seed} size={38} isSquare />
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: '13.5px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.n}
                </b>
                <small style={{ color: 'var(--muted)', fontSize: '12px' }}>
                  {a.price} ج / شهر
                </small>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Comments Modal ── */}
      {activeCommentPost && (
        <div
          className="modal open"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveCommentPost(null);
          }}
        >
          <div className="sheet" style={{ maxWidth: '520px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                تعليقات منشور {activeCommentPost.n}
              </h3>
              <button
                type="button"
                onClick={() => setActiveCommentPost(null)}
                style={{ background: 'none', border: 0, color: 'var(--muted)', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Post Excerpt */}
            <div style={{ background: 'var(--surface2)', padding: '10px 14px', borderRadius: '12px', marginBottom: '14px', fontSize: '13.5px', color: 'var(--white)' }}>
              <b>{activeCommentPost.n}: </b>
              <span style={{ color: 'var(--muted)' }}>
                {activeCommentPost.txt.length > 80
                  ? activeCommentPost.txt.substring(0, 80) + '...'
                  : activeCommentPost.txt}
              </span>
            </div>

            {/* Comments List */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: '160px', maxHeight: '320px', paddingRight: '4px', marginBottom: '14px' }}>
              {(commentsMap[String(activeCommentPost.id)] || []).length > 0 ? (
                (commentsMap[String(activeCommentPost.id)] || []).map((com) => (
                  <div key={com.id} style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start' }}>
                    <div
                      onClick={() => {
                        setActiveCommentPost(null);
                        if (com.authorUid && com.authorUid !== authUser?.uid) {
                          onNavigate('profile', { uid: com.authorUid });
                        } else {
                          onNavigate('profile');
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                      title="عرض الملف الشخصي"
                    >
                      <Avatar name={com.authorName} seed={1} size={36} img={com.authorPhoto} />
                    </div>
                    <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: '12px', padding: '8px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <b
                          onClick={() => {
                            setActiveCommentPost(null);
                            if (com.authorUid && com.authorUid !== authUser?.uid) {
                              onNavigate('profile', { uid: com.authorUid });
                            } else {
                              onNavigate('profile');
                            }
                          }}
                          style={{ fontSize: '13px', cursor: 'pointer', color: 'var(--white)' }}
                        >
                          {com.authorName}
                        </b>
                        <small style={{ fontSize: '11px', color: 'var(--muted)' }}>{com.createdAt}</small>
                      </div>
                      <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.5 }}>{com.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)', fontSize: '13.5px' }}>
                  كن أول من يكتب تعليقاً على هذا المنشور!
                </div>
              )}
            </div>

            {/* Add Comment Input Form */}
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
              <div
                onClick={() => {
                  setActiveCommentPost(null);
                  onNavigate('profile');
                }}
                style={{ cursor: 'pointer', flexShrink: 0 }}
                title="عرض بروفايلي"
              >
                <Avatar
                  name={activeDisplayName}
                  seed={1}
                  size={36}
                  img={activePhoto}
                />
              </div>
              <input
                type="text"
                placeholder="اكتب تعليقك..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                style={{
                  flex: 1,
                  height: '42px',
                  borderRadius: '12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--line)',
                  padding: '0 14px',
                  color: 'var(--white)',
                  fontSize: '13.5px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!newCommentText.trim() || isSubmittingComment}
                style={{
                  height: '42px',
                  padding: '0 16px',
                  borderRadius: '12px',
                  background: 'var(--green)',
                  color: '#04170B',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  border: 0,
                  cursor: newCommentText.trim() ? 'pointer' : 'default',
                  opacity: newCommentText.trim() ? 1 : 0.5,
                }}
              >
                إرسال
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Facebook-Style Share Modal ── */}
      {sharePost && (
        <div
          className="modal open"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSharePost(null);
          }}
        >
          <div className="sheet" style={{ maxWidth: '420px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>مشاركة المنشور</h3>
              <button
                type="button"
                onClick={() => setSharePost(null)}
                style={{ background: 'none', border: 0, color: 'var(--muted)', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Post preview pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface2)', padding: '10px 14px', borderRadius: '12px', marginBottom: '16px' }}>
              <Avatar name={sharePost.n} seed={sharePost.s} size={40} img={sharePost.authorPhoto} />
              <div style={{ overflow: 'hidden' }}>
                <b style={{ fontSize: '13.5px', display: 'block' }}>{sharePost.n}</b>
                <span style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>
                  {sharePost.txt}
                </span>
              </div>
            </div>

            {shareFeedback && (
              <div style={{ background: 'rgba(0, 200, 83, 0.15)', color: 'var(--green)', border: '1px solid var(--green)', borderRadius: '10px', padding: '10px', textAlign: 'center', fontSize: '13.5px', fontWeight: 700, marginBottom: '14px' }}>
                {shareFeedback}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Option 1: Repost on Rabona */}
              <button
                type="button"
                onClick={() => handleRepostOnRabona(sharePost)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--line)',
                  color: 'var(--white)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'right',
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0, 200, 83, 0.15)', color: 'var(--green)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name="share" style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <div style={{ color: 'var(--white)' }}>مشاركة كمنشور على صفحتي</div>
                  <small style={{ color: 'var(--muted)', fontSize: '12px' }}>إعادة نشر المحتوى في الفيد لمتابعيك</small>
                </div>
              </button>

              {/* Option 2: WhatsApp */}
              <button
                type="button"
                onClick={() => handleShareWhatsApp(sharePost)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--line)',
                  color: 'var(--white)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'right',
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#25D36622', color: '#25D366', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-5.805 1.524zm6.299-3.818c1.558.924 3.328 1.411 5.539 1.412 5.449 0 9.882-4.434 9.885-9.884.002-2.64-1.026-5.122-2.894-6.99-1.868-1.869-4.35-2.895-6.992-2.896-5.45 0-9.883 4.434-9.886 9.884-.001 1.954.57 3.86 1.65 5.5l-.364 1.332 1.442-.378 1.62.92z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ color: 'var(--white)' }}>إرسال عبر واتساب (WhatsApp)</div>
                  <small style={{ color: 'var(--muted)', fontSize: '12px' }}>مشاركة عبر محادثات أو مجموعات واتساب</small>
                </div>
              </button>

              {/* Option 3: Copy Link */}
              <button
                type="button"
                onClick={handleCopyPostLink}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--line)',
                  color: 'var(--white)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'right',
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--surface)', color: 'var(--white)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name="rec" style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <div style={{ color: 'var(--white)' }}>نسخ الرابط</div>
                  <small style={{ color: 'var(--muted)', fontSize: '12px' }}>نسخ رابط المنشور للمشاركة في أي مكان</small>
                </div>
              </button>

              {/* Option 4: Native apps share */}
              {'share' in navigator && (
                <button
                  type="button"
                  onClick={() => handleNativeShare(sharePost)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--line)',
                    color: 'var(--white)',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'right',
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--surface)', color: 'var(--white)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="dots" style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--white)' }}>تطبيقات أخرى</div>
                    <small style={{ color: 'var(--muted)', fontSize: '12px' }}>مشاركة عبر تليجرام، ماسنجر، وتطبيقات أخرى</small>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`toast ${shareToast ? 'show' : ''}`} role="status" aria-live="polite">
        {shareToast}
      </div>
    </div>
  );
}
