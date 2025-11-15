import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../utils/firebase';

export function useParcels(userRole, userId, userEmail) {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userRole || !userId) {
      setLoading(false);
      return;
    }

    const parcelsRef = ref(database, 'parcels');
    
    const unsubscribe = onValue(
      parcelsRef,
      (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
          const parcelsArray = Object.entries(data).map(([id, parcel]) => ({
            id,
            ...parcel
          }));

          // Filter based on role
          let filtered = [];
          
          switch(userRole) {
            case 'admin':
              filtered = parcelsArray;
              break;
              
            case 'warehouse':
              filtered = parcelsArray.filter(p => p.info?.warehouseId === userId);
              break;
              
            case 'transporter':
              filtered = parcelsArray.filter(p => 
                p.info?.transporterId === userId || 
                p.info?.status === 'ready' ||
                (p.interestedAgents && p.interestedAgents[userId])
              );
              break;
              
            case 'owner':
              filtered = parcelsArray.filter(p => p.info?.ownerId === userEmail);
              break;
              
            default:
              filtered = [];
          }

          // ✅ FIX: Enrich each parcel with device current data
          const enrichedParcels = filtered.map(parcel => {
            if (parcel.info?.deviceId) {
              // Subscribe to device's current data
              // Only subscribe to device data if user is allowed
              if (userRole === 'admin' || userRole === 'warehouse' || 
                  (userRole === 'transporter' && parcel.info?.transporterId === userId)) {
                const deviceRef = ref(database, `SmartParcels/${parcel.info.deviceId}/current`);
                onValue(deviceRef, (deviceSnapshot) => {
                  const currentData = deviceSnapshot.val();
                  if (currentData) {
                    // Update parcel with current data
                    setParcels(prev => prev.map(p => 
                      p.id === parcel.id 
                        ? { ...p, current: currentData }
                        : p
                    ));
                  }
                }, (error) => {
                  console.error(`Error fetching device data for ${parcel.info.deviceId}:`, error);
                });
              }
            }
            return parcel;
          });

          setParcels(enrichedParcels);
        } else {
          setParcels([]);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching parcels:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userRole, userId, userEmail]);

  return { 
    parcels, 
    loading,
    stats: {
      total: parcels.length,
      ready: parcels.filter(p => p.info?.status === 'ready').length,
      assigned: parcels.filter(p => p.info?.status === 'assigned').length,
      inTransit: parcels.filter(p => ['in_transit', 'picked_up'].includes(p.info?.status)).length,
      delivered: parcels.filter(p => p.info?.status === 'delivered').length,
      cancelled: parcels.filter(p => p.info?.status === 'cancelled').length
    }
  };
}