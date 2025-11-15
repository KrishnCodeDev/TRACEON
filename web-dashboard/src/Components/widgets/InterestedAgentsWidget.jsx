import { useState } from 'react';
import { ThumbsUp, User, MapPin, Clock, Check, AlertCircle } from 'lucide-react';
import { ref, update, set, remove } from 'firebase/database';
import { database } from '../../utils/firebase';
import { useToast } from '../../hooks/useToast';

export default function InterestedAgentsWidget({ parcels }) {
  const [processing, setProcessing] = useState(null);
  const { showSuccess, showError } = useToast();
  
  const parcelsWithInterest = parcels.filter(p => 
    p.interestedAgents && 
    Object.keys(p.interestedAgents).length > 0 &&
    p.info?.status === 'ready'
  );

  const handleAssignAgent = async (parcel, agentId, agentInfo) => {
    if (!confirm(`Assign ${agentInfo.agentName || agentInfo.agentEmail} to parcel ${parcel.info?.parcelId}?`)) return;
    
    setProcessing(agentId);
    try {
      // Update parcel info
      await update(ref(database, `parcels/${parcel.id}/info`), {
        transporterId: agentId,
        status: 'assigned',
        assignedAt: Date.now()
      });

      // Notify the agent
      await set(ref(database, `users/${agentId}/notifications/${Date.now()}`), {
        type: 'assignment',
        message: `You have been assigned parcel ${parcel.info?.parcelId}`,
        parcelId: parcel.id,
        timestamp: Date.now(),
        read: false
      });

      // Clean up interested agents entries
      try {
        await remove(ref(database, `parcels/${parcel.id}/interestedAgents`));
      } catch (e) { /* non-fatal */ }

      showSuccess('Agent assigned successfully!');
    } catch (error) {
      console.error('Assignment error:', error);
      showError('Failed to assign agent: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  if (parcelsWithInterest.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 text-center border">
        <ThumbsUp className="mx-auto text-gray-400 mb-3" size={32} />
        <h3 className="text-lg font-semibold text-gray-900">No Pending Interests</h3>
        <p className="text-sm text-gray-600">Transport agents will appear here when they express interest</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border divide-y">
      <div className="p-4">
        <h3 className="text-lg font-semibold">Pending Agent Interests</h3>
        <p className="text-sm text-gray-600">
          {parcelsWithInterest.length} parcel{parcelsWithInterest.length > 1 ? 's' : ''} with interested agents
        </p>
      </div>

      {parcelsWithInterest.map(parcel => (
        <div key={parcel.id} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium">{parcel.info?.parcelId}</h4>
              <p className="text-sm text-gray-600">{parcel.info?.productDescription}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              parcel.info?.priority === 'urgent' ? 'bg-red-100 text-red-800' :
              parcel.info?.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {parcel.info?.priority}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <MapPin size={16} />
            <span>{parcel.info?.pickupLocation} → {parcel.info?.destination}</span>
          </div>

          <div className="space-y-3">
            {Object.entries(parcel.interestedAgents).map(([agentId, info]) => (
              <div key={agentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span className="font-medium">{info.agentName || info.agentEmail}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <p className="flex items-center gap-1">
                      <Clock size={14} />
                      ETA: {info.eta || 'Not specified'}
                    </p>
                    {info.note && <p className="text-xs italic mt-1">"{info.note}"</p>}
                  </div>
                </div>
                
                <button
                  onClick={() => handleAssignAgent(parcel, agentId, info)}
                  disabled={processing === agentId}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {processing === agentId ? (
                    <>
                      <AlertCircle size={16} />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Assign
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}