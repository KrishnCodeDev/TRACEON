import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../utils/firebase';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

export function useDevices() {
  const { user, userProfile } = useAuth();
  const { showError, showWarning } = useToast();
  const [devices, setDevices] = useState([]);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [assignedDevices, setAssignedDevices] = useState([]);
  const [offlineDevices, setOfflineDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[useDevices] Initializing with user:', user?.uid, 'role:', userProfile?.role);

    if (!user || !userProfile) {
      console.log('[useDevices] No user or profile, skipping');
      setLoading(false);
      return;
    }

    // Only admin and warehouse can fetch devices
    if (userProfile.role !== 'admin' && userProfile.role !== 'warehouse' && userProfile.role !== 'owner') {
      console.log('[useDevices] Role not permitted to fetch devices:', userProfile.role);
      setDevices([]);
      setLoading(false);
      return;
    }

    const devicesRef = ref(database, 'SmartParcels');
    console.log('[useDevices] Subscribing to SmartParcels with role:', userProfile.role);

    
    const unsubscribe = onValue(
      devicesRef,
      (snapshot) => {
        const data = snapshot.val();
        console.log('[useDevices] Raw data received:', data ? Object.keys(data).length + ' devices' : 'null');

        if (data) {
          const now = Date.now();
          const OFFLINE_THRESHOLD = 120000; // 2 minutes

          const devicesArray = Object.entries(data).map(([id, device]) => {
            const lastSeenStr = device.info?.lastSeen;
            const lastSeen = parseInt(lastSeenStr) || 0;
            const timeDiff = now - lastSeen;
            const isOnline = timeDiff < OFFLINE_THRESHOLD;

            console.log(`[useDevices] Device ${id}:`, {
              lastSeenRaw: lastSeenStr,
              lastSeenParsed: lastSeen,
              timeDiffSeconds: Math.round(timeDiff / 1000),
              status: device.info?.status,
              isOnline,
              assigned: device.info?.assignedParcelId || 'none'
            });

            // Preserve assigned status even when offline
            let status = device.info?.status || 'unknown';

            // Only mark as offline if it's NOT assigned to a parcel
            if (!isOnline && status !== 'assigned') {
              status = 'offline';
            }

            return {
              id,
              ...device,
              info: {
                ...device.info,
                status,
                isOnline
              }
            };
          });

          console.log('[useDevices] Processed devices:', {
            total: devicesArray.length,
            available: devicesArray.filter(d => d.info.status === 'available').length,
            assigned: devicesArray.filter(d => d.info.status === 'assigned').length,
            offline: devicesArray.filter(d => !d.info.isOnline && d.info.status !== 'assigned').length
          });

          setDevices(devicesArray);

          // Filter by status
          const available = devicesArray.filter(d => d.info.status === 'available' && d.info.isOnline);
          const assigned = devicesArray.filter(d => d.info.status === 'assigned');
          const offline = devicesArray.filter(d => !d.info.isOnline && d.info.status !== 'assigned');

          console.log('[useDevices] Setting filtered arrays - available:', available.length);

          setAvailableDevices(available);
          setAssignedDevices(assigned);
          setOfflineDevices(offline);
        } else {
          console.log('[useDevices] No data in SmartParcels');
          setDevices([]);
          setAvailableDevices([]);
          setAssignedDevices([]);
          setOfflineDevices([]);
        }

        setLoading(false);
      },
      (error) => {
        console.error('[useDevices] Error fetching devices:', error);
        setLoading(false);
        setError(error.message);

        // Provide a clear UX message for permission issues
        if (error && (error.code === 'PERMISSION_DENIED' || (error.message && error.message.toLowerCase().includes('permission_denied')))) {
          showError('Permission denied reading devices. Check Firebase Realtime Database rules for SmartParcels.');
          console.error('[useDevices] Permission denied - check DB rules. User role:', userProfile?.role);

          // In development, inject a mock device so UI remains usable while debugging
          if (import.meta.env.DEV) {
            console.warn('[DEV] Injecting mock device due to permission_denied');
            const now = Date.now();
            const mockDevices = [
              {
                id: 'DEV_LOCAL_1',
                info: {
                  deviceName: 'DEV_LOCAL_1',
                  macAddress: '00:11:22:33:44:55',
                  lastSeen: String(now),
                  registeredAt: String(now),
                  status: 'available',
                  assignedParcelId: ''
                },
                current: {
                  temperature: 22.5,
                  humidity: 48.2
                }
              }
            ];

            setDevices(mockDevices);
            setAvailableDevices(mockDevices);
            setAssignedDevices([]);
            setOfflineDevices([]);
          }
        } else {
          showError('Error fetching devices: ' + (error.message || error));
        }
      }
    );

    return () => unsubscribe();
  }, [userProfile?.role]);

  return { 
    devices, 
    availableDevices, 
    assignedDevices, 
    offlineDevices, 
    loading,
    stats: {
      total: devices.length,
      available: availableDevices.length,
      assigned: assignedDevices.length,
      offline: offlineDevices.length
    }
  };
}
