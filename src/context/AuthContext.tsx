import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  deleteUser,
  reauthenticateWithPopup,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

export type UserRole = 'player' | 'coach' | 'academy' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  coverURL?: string;
  bio?: string;
  role?: UserRole;
  isRegistered?: boolean;
  playerData?: any;
  coachData?: any;
  academyData?: any;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  isNewUser: boolean;
  signInWithGoogle: () => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
  registerProfile: (role: UserRole, details: any) => Promise<void>;
  updateUserMedia: (photoURL?: string, coverURL?: string, bio?: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  isAdmin: false,
  loading: true,
  isNewUser: false,
  signInWithGoogle: async () => null,
  signOut: async () => {},
  registerProfile: async () => {},
  updateUserMedia: async () => {},
  deleteAccount: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const s = localStorage.getItem('rabona_user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchProfile = async (user: FirebaseUser) => {
    try {
      const token = await user.getIdTokenResult();
      const adminSnapshot = await getDoc(doc(db, 'admins', user.uid));
      setIsAdmin(token.claims.admin === true || adminSnapshot.exists());
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data();
        let roleData = null;

        if (data.role === 'player') {
          const pSnap = await getDoc(doc(db, 'players', user.uid));
          if (pSnap.exists()) roleData = pSnap.data();
        } else if (data.role === 'coach') {
          const cSnap = await getDoc(doc(db, 'coaches', user.uid));
          if (cSnap.exists()) roleData = cSnap.data();
        } else if (data.role === 'academy') {
          const aSnap = await getDoc(doc(db, 'academies', user.uid));
          if (aSnap.exists()) roleData = aSnap.data();
        }

        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: data.displayName || user.displayName || 'لاعب',
          photoURL: data.photoURL || user.photoURL || '',
          coverURL: data.coverURL || '',
          bio: data.bio || '',
          role: data.role,
          isRegistered: true,
          playerData: data.role === 'player' ? roleData : undefined,
          coachData: data.role === 'coach' ? roleData : undefined,
          academyData: data.role === 'academy' ? roleData : undefined,
        };

        setUserProfile(profile);
        setIsNewUser(false);
        void setDoc(doc(db, 'publicProfiles', user.uid), {
          uid: user.uid,
          displayName: profile.displayName,
          photoURL: profile.photoURL || '',
          coverURL: profile.coverURL || '',
          bio: profile.bio || '',
          role: profile.role || 'player',
          updatedAt: serverTimestamp(),
        }, { merge: true }).catch((error) => {
          console.warn('Unable to refresh public profile:', error);
        });
        localStorage.setItem('rabona_user', JSON.stringify({
          ...profile,
          firstName: roleData?.firstName || profile.displayName.split(' ')[0] || 'لاعب',
          lastName: roleData?.lastName || profile.displayName.split(' ')[1] || '',
          type: data.role,
          position: roleData?.position || 'لاعب',
          foot: roleData?.foot || 'يمنى',
          number: roleData?.number || '10',
          photo: data.photoURL || user.photoURL || '',
          cover: data.coverURL || '',
          bio: data.bio || roleData?.bio || '',
          academyName: roleData?.name || profile.displayName,
          address: {
            governorate: roleData?.governorate || '',
            city: roleData?.city || '',
          },
        }));
        return profile;
      } else {
        // User is logged into Google, but hasn't completed Rabona profile yet
        const draftProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          isRegistered: false,
        };
        setUserProfile(draftProfile);
        setIsNewUser(true);
        return draftProfile;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setUserProfile(null);
        setIsNewUser(false);
        setIsAdmin(false);
        await fetchProfile(user);
      } else {
        setUserProfile(null);
        setIsNewUser(false);
        localStorage.removeItem('rabona_user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<UserProfile | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setCurrentUser(result.user);
        const profile = await fetchProfile(result.user);
        return profile;
      }
      return null;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setIsNewUser(false);
      setIsAdmin(false);
      localStorage.removeItem('rabona_user');
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  const registerProfile = async (role: UserRole, details: any) => {
    if (!auth.currentUser) {
      throw new Error('User must be signed in with Google first.');
    }
    const user = auth.currentUser;
    const uid = user.uid;

    try {
      // 1. Create User root doc
      const userRef = doc(db, 'users', uid);
      const existingUserSnapshot = await getDoc(userRef);
      const existingUser = existingUserSnapshot.exists() ? existingUserSnapshot.data() : null;
      await setDoc(userRef, {
        uid,
        email: user.email || '',
        displayName: details.name || `${details.firstName || ''} ${details.lastName || ''}`.trim() || user.displayName || 'لاعب',
        photoURL: details.photoURL || user.photoURL || '',
        coverURL: details.coverURL || '',
        bio: details.bio || '',
        role,
        createdAt: existingUser?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await setDoc(doc(db, 'publicProfiles', uid), {
        uid,
        displayName: details.name || `${details.firstName || ''} ${details.lastName || ''}`.trim() || user.displayName || 'لاعب',
        photoURL: details.photoURL || user.photoURL || '',
        coverURL: details.coverURL || '',
        bio: details.bio || '',
        role,
        updatedAt: serverTimestamp(),
      });

      // 2. Create Role specific doc
      if (role === 'player') {
        const playerRef = doc(db, 'players', uid);
        await setDoc(playerRef, {
          uid,
          firstName: details.firstName || '',
          lastName: details.lastName || '',
          dob: details.dob || '',
          foot: details.foot || 'يمنى',
          position: details.position || 'مهاجم',
          governorate: details.governorate || '',
          city: details.city || '',
          address: details.address || '',
          number: details.number || '10',
          matches: 0,
          goals: 0,
          assists: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else if (role === 'coach') {
        const coachRef = doc(db, 'coaches', uid);
        await setDoc(coachRef, {
          uid,
          firstName: details.firstName || '',
          lastName: details.lastName || '',
          title: details.title || 'مدرب معتمد',
          experienceYears: details.experienceYears || 0,
          specialties: details.specialties || [],
          license: details.license || '',
          governorate: details.governorate || '',
          city: details.city || '',
          venues: details.venues || '',
          plans: details.plans || [],
          ageMin: details.ageMin || 6,
          ageMax: details.ageMax || 18,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else if (role === 'academy') {
        const academyRef = doc(db, 'academies', uid);
        await setDoc(academyRef, {
          id: uid,
          ownerUid: uid,
          name: details.name || '',
          photoURL: details.photoURL || user.photoURL || '',
          coverURL: details.coverURL || '',
          bio: details.bio || '',
          governorate: details.governorate || '',
          city: details.city || '',
          address: details.address || '',
          mapUrl: details.mapUrl || '',
          price: details.price || (details.plans?.[0]?.price ? Number(details.plans[0].price) : 800),
          spots: 20,
          cap: 25,
          minAge: details.ageMin || 6,
          maxAge: details.ageMax || 18,
          rate: 5,
          reviewsCount: 0,
          categories: details.features || [],
          plans: details.plans || [],
          formerPlayers: details.formerPlayers || [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        try {
          const cachedAcademies = JSON.parse(localStorage.getItem('rabona_academies') || '[]');
          const academyItem = {
            id: uid,
            n: details.name || '',
            logo: details.photoURL || user.photoURL || '',
            cover: details.coverURL || '',
            bio: details.bio || '',
            area: [details.governorate, details.city].filter(Boolean).join(' - '),
            address: details.address || '',
            rate: 5,
            reviews: 0,
            min: details.ageMin || 6,
            max: details.ageMax || 18,
            players: 0,
            price: details.price || (details.plans?.[0]?.price ? Number(details.plans[0].price) : 800),
            spots: 20,
            cap: 25,
            categories: details.features || [],
          };

          const withoutCurrent = Array.isArray(cachedAcademies)
            ? cachedAcademies.filter((academy: any) => academy.id !== uid)
            : [];
          localStorage.setItem('rabona_academies', JSON.stringify([academyItem, ...withoutCurrent]));
        } catch (cacheError) {
          console.warn('Unable to cache academy listing:', cacheError);
        }
      }

      await fetchProfile(user);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  };

  const updateUserMedia = async (photoURL?: string, coverURL?: string, bio?: string) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const user = auth.currentUser;
    const userRef = doc(db, 'users', uid);

    try {
      const snap = await getDoc(userRef);
      const existing = snap.exists() ? snap.data() : null;

      const fullDoc = {
        uid,
        email: user.email || existing?.email || '',
        displayName: userProfile?.displayName || user.displayName || existing?.displayName || 'لاعب',
        role: userProfile?.role || existing?.role || 'player',
        photoURL: photoURL !== undefined ? photoURL : (userProfile?.photoURL || existing?.photoURL || user.photoURL || ''),
        coverURL: coverURL !== undefined ? coverURL : (userProfile?.coverURL || existing?.coverURL || ''),
        bio: bio !== undefined ? bio : (userProfile?.bio || existing?.bio || ''),
        createdAt: existing?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userRef, fullDoc, { merge: true });
      await setDoc(doc(db, 'publicProfiles', uid), {
        uid,
        displayName: fullDoc.displayName,
        photoURL: fullDoc.photoURL,
        coverURL: fullDoc.coverURL,
        bio: fullDoc.bio,
        role: fullDoc.role,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setUserProfile((prev) => (prev ? {
        ...prev,
        photoURL: fullDoc.photoURL,
        coverURL: fullDoc.coverURL,
        bio: fullDoc.bio,
      } : {
        uid,
        email: fullDoc.email,
        displayName: fullDoc.displayName,
        role: fullDoc.role as UserRole,
        photoURL: fullDoc.photoURL,
        coverURL: fullDoc.coverURL,
        bio: fullDoc.bio,
        isRegistered: true,
      }));

      try {
        const stored = JSON.parse(localStorage.getItem('rabona_user') || '{}');
        localStorage.setItem('rabona_user', JSON.stringify({
          ...stored,
          photo: fullDoc.photoURL,
          photoURL: fullDoc.photoURL,
          cover: fullDoc.coverURL,
          coverURL: fullDoc.coverURL,
          bio: fullDoc.bio,
        }));
      } catch {}
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const deleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const uid = user.uid;
    await reauthenticateWithPopup(user, googleProvider);
    const postsSnapshot = await getDocs(query(collection(db, 'posts'), where('authorUid', '==', uid)));
    const bookingsSnapshot = await getDocs(query(collection(db, 'bookings'), where('userUid', '==', uid)));
    const refs = [
      doc(db, 'users', uid),
      doc(db, 'publicProfiles', uid),
      doc(db, 'players', uid),
      doc(db, 'coaches', uid),
      doc(db, 'academies', uid),
      ...postsSnapshot.docs.map((post) => post.ref),
      ...bookingsSnapshot.docs.map((booking) => booking.ref),
    ];

    for (let index = 0; index < refs.length; index += 450) {
      const batch = writeBatch(db);
      refs.slice(index, index + 450).forEach((reference) => batch.delete(reference));
      await batch.commit();
    }
    await deleteUser(user);
    setCurrentUser(null);
    setUserProfile(null);
    setIsNewUser(false);
    localStorage.clear();
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await fetchProfile(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        loading,
        isNewUser,
        signInWithGoogle,
        signOut,
        registerProfile,
        updateUserMedia,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
