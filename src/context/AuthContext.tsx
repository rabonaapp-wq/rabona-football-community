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
  hasAcademy?: boolean;
}

export type ActiveAccount = 'personal' | 'academy';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isAcademyOwner: boolean;
  activeAccount: ActiveAccount;
  switchAccount: (account: ActiveAccount) => void;
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
  isAcademyOwner: false,
  activeAccount: 'personal',
  switchAccount: () => {},
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
  const [isAcademyOwner, setIsAcademyOwner] = useState(false);
  const [activeAccount, setActiveAccountState] = useState<ActiveAccount>(() => (
    localStorage.getItem('rabona_active_account') === 'academy' ? 'academy' : 'personal'
  ));

  const switchAccount = (account: ActiveAccount) => {
    const nextAccount = account === 'academy' && !isAcademyOwner ? 'personal' : account;
    setActiveAccountState(nextAccount);
    localStorage.setItem('rabona_active_account', nextAccount);
  };

  const fetchProfile = async (user: FirebaseUser, syncPublicProfile = true) => {
    try {
      const token = await user.getIdTokenResult(true);
      const adminSnapshot = await getDoc(doc(db, 'admins', user.uid));
      setIsAdmin(token.claims.admin === true || adminSnapshot.exists());
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);
      const academySnapshot = await getDoc(doc(db, 'academies', user.uid));
      setIsAcademyOwner(academySnapshot.exists() && academySnapshot.data().ownerUid === user.uid);
      if (!academySnapshot.exists() && activeAccount === 'academy') {
        switchAccount('personal');
      }

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
        const academyData = academySnapshot.exists() ? academySnapshot.data() : undefined;

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
          academyData: academyData || (data.role === 'academy' ? roleData : undefined),
          hasAcademy: Boolean(academyData),
        };

        setUserProfile(profile);
        setIsNewUser(false);
        if (syncPublicProfile) {
          await setDoc(doc(db, 'publicProfiles', user.uid), {
            uid: user.uid,
            displayName: profile.displayName,
            photoURL: profile.photoURL || '',
            coverURL: profile.coverURL || '',
            bio: profile.bio || '',
            role: profile.role || 'player',
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
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
          academyName: academyData?.name || roleData?.name || profile.displayName,
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
          hasAcademy: academySnapshot.exists(),
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
        setIsAcademyOwner(false);
        switchAccount('personal');
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
      setIsAcademyOwner(false);
      switchAccount('personal');
      localStorage.removeItem('rabona_user');
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  const registerProfile = async (role: UserRole, details: any) => {
    if (!auth.currentUser) {
      throw new Error('User must be signed in with Google first.');
    }
    if (role !== 'player' && role !== 'coach' && role !== 'academy') {
      throw new Error('Unsupported registration role.');
    }
    const user = auth.currentUser;
    const uid = user.uid;
    const userRef = doc(db, 'users', uid);
    const existing = await getDoc(userRef);
    const existingData = existing.exists() ? existing.data() : null;
    const existingAcademy = role === 'academy'
      ? await getDoc(doc(db, 'academies', uid))
      : null;
    const existingAcademyData = existingAcademy?.exists() ? existingAcademy.data() : null;
    const profileRole = role === 'academy' && existingData?.role
      ? existingData.role
      : role;
    const displayName = details.name
      || `${details.firstName || ''} ${details.lastName || ''}`.trim()
      || user.displayName
      || 'لاعب';
    const batch = writeBatch(db);

    batch.set(userRef, {
      uid,
      email: user.email || '',
      displayName,
      photoURL: details.photoURL || user.photoURL || '',
      coverURL: details.coverURL || '',
      bio: details.bio || '',
      role: profileRole,
      createdAt: existingData?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    batch.set(doc(db, 'publicProfiles', uid), {
      uid,
      displayName,
      photoURL: details.photoURL || user.photoURL || '',
      coverURL: details.coverURL || '',
      bio: details.bio || '',
      role: profileRole,
      updatedAt: serverTimestamp(),
    });

    if (role === 'player') {
      batch.set(doc(db, 'players', uid), {
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
      batch.set(doc(db, 'coaches', uid), {
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
    } else {
      batch.set(doc(db, 'academies', uid), {
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
        price: details.price || 800,
        spots: 20,
        cap: 25,
        minAge: details.ageMin || 6,
        maxAge: details.ageMax || 18,
        rate: existingAcademyData?.rate ?? 5,
        reviewsCount: existingAcademyData?.reviewsCount ?? 0,
        categories: details.features || [],
        plans: details.plans || [],
        formerPlayers: details.formerPlayers || [],
        createdAt: existingAcademyData?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: Boolean(existingAcademyData) });
    }

    await batch.commit();
    await fetchProfile(user, false);

    /*
    const user = auth.currentUser;
    const uid = user.uid;
    const token = await user.getIdTokenResult(true);
    const hasAdminClaim = token.claims.admin === true;
    const operations: RegistrationOperation[] = [];

    try {
      // 1. Create User root doc
      const userRef = doc(db, 'users', uid);
      const existingUserSnapshot = await getDoc(userRef);
      const existingUser = existingUserSnapshot.exists() ? existingUserSnapshot.data() : null;
      if (existingUser?.role && existingUser.role !== role && !hasAdminClaim) {
        console.error('Registration blocked: role change requires a trusted admin claim.', {
          uid,
          existingRole: existingUser.role,
          requestedRole: role,
          hasAdminClaim,
        });
        throw new Error(REGISTRATION_SUPER_ADMIN_CLAIM_REQUIRED);
      }
      const batch = writeBatch(db);
      const queueSet = (
        action: RegistrationOperation['action'],
        path: string,
        reference: ReturnType<typeof doc>,
        data: Record<string, unknown>,
        merge = false
      ) => {
        operations.push({ action, path });
        if (merge) {
          batch.set(reference, data, { merge: true });
        } else {
          batch.set(reference, data);
        }
      };
      if (hasAdminClaim && existingUser?.role && existingUser.role !== role) {
        const previousRoleCollection =
          existingUser.role === 'player'
            ? 'players'
            : existingUser.role === 'coach'
              ? 'coaches'
              : existingUser.role === 'academy'
                ? 'academies'
                : null;
        if (previousRoleCollection) {
          operations.unshift({ action: 'delete', path: `${previousRoleCollection}/${uid}` });
          batch.delete(doc(db, previousRoleCollection, uid));
        }
      }
      queueSet(existingUserSnapshot.exists() ? 'update' : 'create', `users/${uid}`, userRef, {
        uid,
        email: user.email || '',
        displayName: details.name || `${details.firstName || ''} ${details.lastName || ''}`.trim() || user.displayName || 'لاعب',
        photoURL: details.photoURL || user.photoURL || '',
        coverURL: details.coverURL || '',
        bio: details.bio || '',
        role,
        createdAt: existingUser?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, true);
      queueSet('write', `publicProfiles/${uid}`, doc(db, 'publicProfiles', uid), {
        uid,
        displayName: details.name || `${details.firstName || ''} ${details.lastName || ''}`.trim() || user.displayName || 'لاعب',
        photoURL: details.photoURL || user.photoURL || '',
        coverURL: details.coverURL || '',
        bio: details.bio || '',
        role,
        updatedAt: serverTimestamp(),
      });
      let academyCacheItem: Record<string, unknown> | null = null;

      // 2. Create Role specific doc
      if (role === 'player') {
        const playerRef = doc(db, 'players', uid);
        queueSet('write', `players/${uid}`, playerRef, {
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
        queueSet('write', `coaches/${uid}`, coachRef, {
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
        queueSet('write', `academies/${uid}`, academyRef, {
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
        academyCacheItem = {
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
      } else {
        throw new Error('Unsupported registration role.');
      }

      await batch.commit();
      if (academyCacheItem) {
        try {
          const cachedAcademies = JSON.parse(localStorage.getItem('rabona_academies') || '[]');
          const withoutCurrent = Array.isArray(cachedAcademies)
            ? cachedAcademies.filter((academy: any) => academy.id !== uid)
            : [];
          localStorage.setItem('rabona_academies', JSON.stringify([academyCacheItem, ...withoutCurrent]));
        } catch (cacheError) {
          console.warn('Unable to cache academy listing:', cacheError);
        }
      }
      await fetchProfile(user, false);
    } catch (error) {
      if (error instanceof Error && error.message === 'Unsupported registration role.') {
        throw error;
      }
      logRegistrationFailure(error, uid, operations);
    }
    */
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
    setIsAcademyOwner(false);
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
        isAcademyOwner,
        activeAccount,
        switchAccount,
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
