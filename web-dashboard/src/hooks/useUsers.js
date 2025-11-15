import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../utils/firebase';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        const data = snapshot.val();
        console.log('[useUsers] Raw snapshot:', data ? Object.keys(data).length + ' users' : 'null');
        
        if (data) {
          const usersArray = Object.entries(data).map(([uid, userData]) => {
            const profile = userData?.profile || {};
            console.log(`[useUsers] User ${uid}:`, { email: profile.email, role: profile.role, verified: profile.verified });
            
            return {
              uid,
              email: profile.email || 'N/A',
              role: profile.role || 'unassigned',
              verified: profile.verified || false,
              banned: profile.banned || false,
              createdAt: profile.createdAt || Date.now()
            };
          });

          console.log('[useUsers] Processed:', usersArray.length, 'users');
          setUsers(usersArray);
        } else {
          console.log('[useUsers] No data');
          setUsers([]);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('[useUsers] Error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { 
    users, 
    loading,
    pendingUsers: users.filter(u => !u.verified && !u.banned && u.role !== 'owner'),
    verifiedUsers: users.filter(u => u.verified && !u.banned),
    bannedUsers: users.filter(u => u.banned),
    stats: {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      warehouse: users.filter(u => u.role === 'warehouse').length,
      transporters: users.filter(u => u.role === 'transporter').length,
      owners: users.filter(u => u.role === 'owner').length,
      pending: users.filter(u => !u.verified && !u.banned).length
    }
  };
}