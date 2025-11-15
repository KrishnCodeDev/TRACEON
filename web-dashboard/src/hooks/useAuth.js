import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, get } from 'firebase/database';
import { auth, database, MASTER_ADMIN_EMAIL } from '../utils/firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Check if master admin (case-insensitive)
        const isAdmin = currentUser.email?.toLowerCase() === MASTER_ADMIN_EMAIL?.toLowerCase();
        
        // Fetch existing profile first
        const profileRef = ref(database, `users/${currentUser.uid}/profile`);
        const { get, set } = await import('firebase/database');
        const profileSnapshot = await get(profileRef);
        const existingProfile = profileSnapshot.val();
        
        if (isAdmin) {
          // Master admin detected - force update profile
          console.log('[AUTH] Master admin detected:', currentUser.email);
          
          await set(ref(database, `users/${currentUser.uid}/profile`), {
            email: currentUser.email,
            role: 'admin',
            verified: true,
            createdAt: existingProfile?.createdAt || Date.now()
          });
          
          await set(ref(database, `system/admins/${currentUser.uid}`), true);
          
          console.log('[AUTH] Master admin profile created/updated');
        }
        
        // Subscribe to profile updates
        const profileUnsubscribe = onValue(profileRef, (snapshot) => {
          const profile = snapshot.val();
          
          // If admin but profile says otherwise, force refresh
          if (isAdmin && profile?.role !== 'admin') {
            console.warn('[AUTH] Profile role mismatch - refreshing...');
            window.location.reload();
          }
          
          setUserProfile(profile);
          setLoading(false);
        }, (error) => {
          console.error('Error fetching profile:', error);
          setLoading(false);
        });

        return () => profileUnsubscribe();
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, userProfile, loading };
}