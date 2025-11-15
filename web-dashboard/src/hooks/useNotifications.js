import { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '../utils/firebase';

export function useNotifications(userId, limit = 10) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const notificationsRef = ref(database, `users/${userId}/notifications`);
    
    const unsubscribe = onValue(
      notificationsRef,
      (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
          const notifArray = Object.entries(data)
            .map(([id, notif]) => ({ id, ...notif }))
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
          
          setNotifications(notifArray);
          setUnreadCount(notifArray.filter(n => !n.read).length);
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, limit]);

  return { notifications, unreadCount, loading };
}