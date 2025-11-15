import { useState } from 'react';
import { Plus, Package, HardDrive, Search, Filter } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useParcels } from '../../hooks/useParcels';
import { useDevices } from '../../hooks/useDevices';
import CreateParcelModal from '../modals/CreateParcelModal';
import ParcelDetailModal from '../modals/ParcelDetailModal';
import ParcelCard from '../cards/ParcelCard';
import DevicePoolView from '../views/DevicePoolView';
import DashboardStats from '../shared/DashboardStats';

export default function WarehouseDashboard({ activeTab }) {
  const { user, userProfile } = useAuth();
  const { parcels, stats, loading } = useParcels(userProfile?.role, user?.uid, user?.email);
  const { availableDevices, stats: deviceStats } = useDevices();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedParcel, setSelectedParcel] = useState(null);

  const filteredParcels = parcels.filter(p => {
    const matchesSearch = p.info?.parcelId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.info?.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.info?.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || p.info?.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (activeTab === 'devices') {
    return <DevicePoolView />;
  }

  if (activeTab === 'dashboard') {
    return (
      <div className="p-6 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Warehouse Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage parcels and monitor device pool</p>
        </div>

        <DashboardStats 
          stats={[
            { label: 'Total Parcels', value: stats.total, icon: Package, color: 'primary' },
            { label: 'Ready for Dispatch', value: stats.ready, icon: Package, color: 'blue' },
            { label: 'In Transit', value: stats.inTransit, icon: Package, color: 'orange' },
            { label: 'Available Devices', value: deviceStats.available, icon: HardDrive, color: 'green' },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Parcels</h3>
            <div className="space-y-3">
              {parcels.slice(0, 5).map(parcel => (
                <div key={parcel.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{parcel.info?.parcelId}</p>
                    <p className="text-sm text-gray-600">{parcel.info?.destination}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    parcel.info?.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    parcel.info?.status === 'in_transit' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {parcel.info?.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Device Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Available</span>
                <span className="text-2xl font-bold text-green-600">{deviceStats.available}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Assigned</span>
                <span className="text-2xl font-bold text-blue-600">{deviceStats.assigned}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Offline</span>
                <span className="text-2xl font-bold text-red-600">{deviceStats.offline}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parcels Management</h1>
          <p className="text-gray-600 mt-1">Create and monitor all parcels</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <Plus size={20} />
          Create Parcel
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by ID, destination, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          >
            <option value="all">All Status</option>
            <option value="ready">Ready</option>
            <option value="assigned">Assigned</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Parcels Grid */}
      {loading ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading parcels...</p>
        </div>
      ) : filteredParcels.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <Package className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold mb-2 text-gray-900">No Parcels Found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Create your first parcel to get started'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create First Parcel
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredParcels.map(parcel => (
            <ParcelCard 
              key={parcel.id} 
              parcel={parcel}
              onClick={() => setSelectedParcel(parcel)}
              role="warehouse"
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateParcelModal
          availableDevices={availableDevices}
          onClose={() => setShowCreateModal(false)}
          warehouseId={user?.uid}
        />
      )}

      {/* ✅ FIX: Add missing ParcelDetailModal */}
      {selectedParcel && (
        <ParcelDetailModal
          parcel={selectedParcel}
          onClose={() => setSelectedParcel(null)}
          role="warehouse"
        />
      )}
    </div>
  );
}
