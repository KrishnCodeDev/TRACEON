import { useState } from 'react';
import { Package, Truck, MapPin, Clock, ThumbsUp, AlertCircle } from 'lucide-react';
import { ref, set, update } from 'firebase/database';
import { database } from '../../utils/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useParcels } from '../../hooks/useParcels';
import { toast } from 'react-hot-toast';
import { useToast } from '../../hooks/useToast';
import ParcelCard from '../cards/ParcelCard';
import DashboardStats from '../shared/DashboardStats';
import ParcelDetailModal from '../modals/ParcelDetailModal';

export default function TransporterDashboard({ activeTab, onTabChange }) {
  const { user, userProfile } = useAuth();
  const { parcels, stats, loading } = useParcels(userProfile?.role, user?.uid, user?.email);
  const { showSuccess, showError, showWarning } = useToast();
  
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [showInterestModal, setShowInterestModal] = useState(null);
  const [interestNote, setInterestNote] = useState('');
  const [interestEta, setInterestEta] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filterRoute, setFilterRoute] = useState('all');

  // Separate parcels by status
  const myAssignedParcels = parcels.filter(p => p.info?.transporterId === user?.uid);
  const availableParcels = parcels.filter(p => p.info?.status === 'ready');
  const interestedParcels = parcels.filter(p => 
    p.interestedAgents && p.interestedAgents[user?.uid] && p.info?.status === 'ready'
  );

  const handleExpressInterest = async (parcel) => {
    if (!interestNote.trim()) {
      showWarning('Please add a note about your interest');
      return;
    }

    setProcessing(true);
    try {
      await set(ref(database, `parcels/${parcel.id}/interestedAgents/${user.uid}`), {
        timestamp: Date.now(),
        note: interestNote,
        eta: interestEta || 'Not specified',
        agentEmail: user.email,
        agentName: userProfile?.name || user.email
      });

      // Notify warehouse
      const warehouseId = parcel.info?.warehouseId;
      if (warehouseId) {
        await set(ref(database, `users/${warehouseId}/notifications/${Date.now()}`), {
          type: 'agent_interest',
          message: `Transport agent interested in parcel ${parcel.info.parcelId}`,
          parcelId: parcel.id,
          agentId: user.uid,
          agentEmail: user.email,
          timestamp: Date.now(),
          read: false
        });
      }

      showSuccess('Interest expressed! Warehouse will review your request.');
      setShowInterestModal(null);
      setInterestNote('');
      setInterestEta('');
    } catch (error) {
      console.error('Error:', error);
      showError('Failed to express interest: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStatus = async (parcelId, newStatus) => {
    if (!confirm(`Update parcel status to "${newStatus}"?`)) return;

    setProcessing(true);
    try {
      const updates = {
        status: newStatus
      };

      // Add timestamps
      if (newStatus === 'picked_up') {
        updates.pickedUpAt = Date.now();
      } else if (newStatus === 'in_transit') {
        updates.dispatchedAt = Date.now();
      } else if (newStatus === 'delivered') {
        updates.deliveredAt = Date.now();
      }

      await update(ref(database, `parcels/${parcelId}/info`), updates);

      // Notify owner
      const parcel = parcels.find(p => p.id === parcelId);
      if (parcel?.info?.ownerId) {
        await set(ref(database, `users/${parcel.info.ownerId.replace(/[.#$[\]]/g, '_')}/notifications/${Date.now()}`), {
          type: 'status_update',
          message: `Parcel ${parcel.info.parcelId} status updated to ${newStatus}`,
          parcelId: parcelId,
          timestamp: Date.now(),
          read: false
        });
      }

      showSuccess('Parcel status updated successfully!');
    } catch (error) {
      console.error('Error:', error);
      showError('Failed to update status: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredAvailable = filterRoute === 'all' 
    ? availableParcels 
    : availableParcels.filter(p => {
        const route = `${p.info?.pickupLocation} → ${p.info?.destination}`;
        return route.toLowerCase().includes(filterRoute.toLowerCase());
      });

  if (activeTab === 'dashboard') {
    return (
      <div className="p-6 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Transport Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage deliveries and discover new routes</p>
        </div>

        <DashboardStats 
          stats={[
            { label: 'Assigned Parcels', value: myAssignedParcels.length, icon: Package, color: 'primary' },
            { label: 'Available Parcels', value: availableParcels.length, icon: Truck, color: 'blue' },
            { label: 'Interested In', value: interestedParcels.length, icon: ThumbsUp, color: 'purple' },
            { label: 'In Transit', value: myAssignedParcels.filter(p => ['in_transit', 'picked_up'].includes(p.info?.status)).length, icon: MapPin, color: 'orange' },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Active Deliveries */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Active Deliveries</h3>
            {myAssignedParcels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Truck className="mx-auto mb-2" size={32} />
                <p className="text-sm">No active deliveries</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myAssignedParcels.slice(0, 5).map(parcel => (
                  <div 
                    key={parcel.id}
                    onClick={() => setSelectedParcel(parcel)}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium">{parcel.info?.parcelId}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        parcel.info?.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {parcel.info?.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">To: {parcel.info?.destination}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-primary-900">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => onTabChange?.('transport')}
                className="w-full flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <Package className="text-blue-600" size={24} />
                  <div className="text-left">
                    <p className="font-medium">Browse Available Parcels</p>
                    <p className="text-xs text-gray-600">{availableParcels.length} ready for pickup</p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </button>

              {interestedParcels.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="text-yellow-600" size={20} />
                    <p className="font-medium text-yellow-900">Pending Assignments</p>
                  </div>
                  <p className="text-sm text-yellow-800">
                    You've expressed interest in {interestedParcels.length} parcel{interestedParcels.length > 1 ? 's' : ''}. 
                    Waiting for warehouse approval.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'transport') {
    return (
      <div className="p-6 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Available Parcels</h1>
          <p className="text-gray-600 mt-1">Browse parcels ready for delivery</p>
        </div>

        {/* Route Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Route</label>
          <input
            type="text"
            value={filterRoute}
            onChange={(e) => setFilterRoute(e.target.value)}
            placeholder="e.g., Mumbai, Delhi, Pune..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Available Parcels Grid */}
        {loading ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading parcels...</p>
          </div>
        ) : filteredAvailable.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">No Available Parcels</h3>
            <p className="text-gray-600">
              {filterRoute !== 'all' ? 'Try adjusting your route filter' : 'Check back later for new parcels'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAvailable.map(parcel => {
              const hasExpressedInterest = parcel.interestedAgents?.[user?.uid];
              
              return (
                <div key={parcel.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-4">
                    <h3 className="text-lg font-bold">{parcel.info?.parcelId}</h3>
                    <p className="text-sm opacity-90">{parcel.info?.productDescription}</p>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="text-gray-400 flex-shrink-0" size={16} />
                      <div className="text-sm">
                        <p className="text-gray-600">From: {parcel.info?.pickupLocation}</p>
                        <p className="font-medium">To: {parcel.info?.destination}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-600">Weight</p>
                        <p className="font-semibold">{parcel.info?.weight} kg</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Priority</p>
                        <p className={`font-semibold capitalize ${
                          parcel.info?.priority === 'urgent' ? 'text-red-600' :
                          parcel.info?.priority === 'high' ? 'text-orange-600' :
                          'text-gray-900'
                        }`}>
                          {parcel.info?.priority}
                        </p>
                      </div>
                    </div>

                    {hasExpressedInterest ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                        <Clock className="inline text-yellow-600 mb-1" size={20} />
                        <p className="text-sm font-medium text-yellow-900">Interest Expressed</p>
                        <p className="text-xs text-yellow-700">Awaiting warehouse response</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowInterestModal(parcel)}
                        className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <ThumbsUp size={16} />
                        Express Interest
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedParcel(parcel)}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'parcels') {
    return (
      <div className="p-6 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Assigned Parcels</h1>
          <p className="text-gray-600 mt-1">Manage and update delivery status</p>
        </div>

        {myAssignedParcels.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Truck className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">No Assigned Parcels</h3>
            <p className="text-gray-600 mb-6">Express interest in available parcels to get started</p>
            <button
              onClick={() => setActiveTab('transport')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse Available Parcels
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {myAssignedParcels.map(parcel => (
              <div key={parcel.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <ParcelCard parcel={parcel} onClick={() => setSelectedParcel(parcel)} role="transporter" />
                
                <div className="p-4 border-t border-gray-200 space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Update Status:</p>
                  
                  {parcel.info?.status === 'assigned' && (
                    <button
                      onClick={() => handleUpdateStatus(parcel.id, 'picked_up')}
                      disabled={processing}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
                    >
                      Mark as Picked Up
                    </button>
                  )}
                  
                  {parcel.info?.status === 'picked_up' && (
                    <button
                      onClick={() => handleUpdateStatus(parcel.id, 'in_transit')}
                      disabled={processing}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors text-sm"
                    >
                      Mark as In Transit
                    </button>
                  )}
                  
                  {parcel.info?.status === 'in_transit' && (
                    <button
                      onClick={() => handleUpdateStatus(parcel.id, 'delivered')}
                      disabled={processing}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm"
                    >
                      Mark as Delivered ✓
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Interest Modal
  return (
    <div className="relative">
      {showInterestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-slide-up">
            <div className="bg-primary-600 text-white p-6 rounded-t-xl">
              <h3 className="text-xl font-bold">Express Interest</h3>
              <p className="text-sm opacity-90">Parcel: {showInterestModal.info?.parcelId}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why are you interested? *
                </label>
                <textarea
                  value={interestNote}
                  onChange={(e) => setInterestNote(e.target.value)}
                  rows="3"
                  placeholder="e.g., I'm heading this route tomorrow..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Time (Optional)
                </label>
                <input
                  type="text"
                  value={interestEta}
                  onChange={(e) => setInterestEta(e.target.value)}
                  placeholder="e.g., 2 hours, Tomorrow morning..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowInterestModal(null);
                    setInterestNote('');
                    setInterestEta('');
                  }}
                  disabled={processing}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExpressInterest(showInterestModal)}
                  disabled={processing || !interestNote.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400"
                >
                  {processing ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedParcel && (
        <ParcelDetailModal
          parcel={selectedParcel}
          onClose={() => setSelectedParcel(null)}
          role="transporter"
        />
      )}
    </div>
  );
}