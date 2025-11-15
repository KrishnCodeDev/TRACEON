import { useState } from 'react';
import { Package, Clock, CheckCircle, Truck, AlertTriangle, MapPin } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useParcels } from '../../hooks/useParcels';
import { useNotifications } from '../../hooks/useNotifications';
import ParcelDetailModal from '../modals/ParcelDetailModal';
import DashboardStats from '../shared/DashboardStats';
import { toast } from 'react-hot-toast';

export default function OwnerDashboard({ activeTab }) {
  const { user } = useAuth();
  const { parcels, stats, loading } = useParcels('owner', user?.uid, user?.email);
  const { notifications } = useNotifications(user?.email?.replace(/[.#$[\]]/g, '_'));
  
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredParcels = filterStatus === 'all' 
    ? parcels 
    : parcels.filter(p => p.info?.status === filterStatus);

  const activeAlerts = parcels.reduce((count, p) => {
    if (p.alerts) {
      return count + Object.values(p.alerts).filter(a => !a.resolved).length;
    }
    return count;
  }, 0);

  const getStatusSteps = (parcel) => {
    const steps = [
      { 
        id: 'created', 
        label: 'Created', 
        icon: Package, 
        completed: !!parcel.info?.createdAt,
        timestamp: parcel.info?.createdAt 
      },
      { 
        id: 'assigned', 
        label: 'Assigned', 
        icon: CheckCircle, 
        completed: !!parcel.info?.assignedAt,
        timestamp: parcel.info?.assignedAt 
      },
      { 
        id: 'picked_up', 
        label: 'Picked Up', 
        icon: Truck, 
        completed: !!parcel.info?.pickedUpAt,
        timestamp: parcel.info?.pickedUpAt 
      },
      { 
        id: 'in_transit', 
        label: 'In Transit', 
        icon: Truck, 
        completed: !!parcel.info?.dispatchedAt,
        timestamp: parcel.info?.dispatchedAt 
      },
      { 
        id: 'delivered', 
        label: 'Delivered', 
        icon: CheckCircle, 
        completed: !!parcel.info?.deliveredAt,
        timestamp: parcel.info?.deliveredAt 
      }
    ];

    return steps;
  };

  const renderDashboard = () => {
    return (
      <div className="p-6 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Parcels</h1>
          <p className="text-gray-600 mt-1">Track your deliveries in real-time</p>
        </div>

        <DashboardStats 
          stats={[
            { label: 'Total Parcels', value: stats.total, icon: Package, color: 'primary' },
            { label: 'In Transit', value: stats.inTransit, icon: Truck, color: 'orange' },
            { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'green' },
            { label: 'Active Alerts', value: activeAlerts, icon: AlertTriangle, color: 'red' },
          ]}
        />

        {/* Active Shipments */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Active Shipments</h3>
          
          {parcels.filter(p => ['ready', 'assigned', 'picked_up', 'in_transit'].includes(p.info?.status)).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Truck className="mx-auto mb-2" size={32} />
              <p className="text-sm">No active shipments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {parcels
                .filter(p => ['ready', 'assigned', 'picked_up', 'in_transit'].includes(p.info?.status))
                .map(parcel => (
                  <div 
                    key={parcel.id}
                    onClick={() => setSelectedParcel(parcel)}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{parcel.info?.parcelId}</h4>
                        <p className="text-sm text-gray-600">{parcel.info?.productDescription}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        parcel.info?.status === 'in_transit' ? 'bg-orange-100 text-orange-800' :
                        parcel.info?.status === 'picked_up' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {parcel.info?.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <MapPin size={14} />
                      <span>To: {parcel.info?.destination}</span>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-between">
                      {getStatusSteps(parcel).map((step, index) => (
                        <div key={step.id} className="flex-1 flex items-center">
                          <div className={`flex flex-col items-center ${index < getStatusSteps(parcel).length - 1 ? 'flex-1' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                            }`}>
                              <step.icon size={16} />
                            </div>
                            <span className="text-xs text-gray-600 mt-1 hidden sm:block">{step.label}</span>
                          </div>
                          {index < getStatusSteps(parcel).length - 1 && (
                            <div className={`flex-1 h-1 ${
                              step.completed ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>

                    {parcel.current && (
                      <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Temperature:</span>
                          <span className="font-semibold ml-2">{parcel.current.temperature?.toFixed(1)}°C</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Humidity:</span>
                          <span className="font-semibold ml-2">{parcel.current.humidity?.toFixed(1)}%</span>
                        </div>
                      </div>
                    )}

                    {parcel.alerts && Object.values(parcel.alerts).filter(a => !a.resolved).length > 0 && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2">
                        <AlertTriangle className="text-red-600" size={16} />
                        <p className="text-xs text-red-600 font-medium">
                          {Object.values(parcel.alerts).filter(a => !a.resolved).length} active alert(s)
                        </p>
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderParcels = () => {
    return (
      <div className="p-6 animate-fade-in">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Parcels</h1>
            <p className="text-gray-600 mt-1">Complete delivery history</p>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="ready">Ready</option>
            <option value="assigned">Assigned</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading parcels...</p>
          </div>
        ) : filteredParcels.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">No Parcels Found</h3>
            <p className="text-gray-600">
              {filterStatus !== 'all' ? 'Try adjusting your filter' : 'No parcels assigned to your email yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredParcels.map(parcel => (
              <div 
                key={parcel.id}
                onClick={() => setSelectedParcel(parcel)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer"
              >
                <div className={`p-4 ${
                  parcel.info?.status === 'delivered' ? 'bg-green-500' :
                  parcel.info?.status === 'in_transit' ? 'bg-orange-500' :
                  parcel.info?.status === 'cancelled' ? 'bg-gray-500' :
                  'bg-primary-500'
                } text-white`}>
                  <h3 className="text-lg font-bold">{parcel.info?.parcelId}</h3>
                  <p className="text-sm opacity-90">{parcel.info?.productDescription}</p>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="text-gray-400" size={14} />
                    <span className="text-gray-600">To: {parcel.info?.destination}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="text-gray-400" size={14} />
                    <span className="text-gray-600">
                      Created: {new Date(parcel.info?.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {parcel.info?.deliveredAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-500" size={14} />
                      <span className="text-gray-600">
                        Delivered: {new Date(parcel.info.deliveredAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      parcel.info?.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      parcel.info?.status === 'in_transit' ? 'bg-orange-100 text-orange-800' :
                      parcel.info?.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {parcel.info?.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {activeTab === 'dashboard' ? renderDashboard() : 
       activeTab === 'parcels' ? renderParcels() : null}
       
      {selectedParcel && (
        <ParcelDetailModal
          parcel={selectedParcel}
          onClose={() => setSelectedParcel(null)}
          role="owner"
        />
      )}
    </>
  );
}