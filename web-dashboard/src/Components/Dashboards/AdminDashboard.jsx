import { useState } from 'react';
import { Users, Package, HardDrive, BarChart3, CheckCircle, XCircle, Search } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { database } from '../../utils/firebase';
import { useUsers } from '../../hooks/useUsers';
import { useParcels } from '../../hooks/useParcels';
import { useDevices } from '../../hooks/useDevices';
import { useAuth } from '../../hooks/useAuth';
import DashboardStats from '../shared/DashboardStats';
import DevicePoolView from '../views/DevicePoolView';
import ParcelCard from '../cards/ParcelCard';
import ParcelDetailModal from '../modals/ParcelDetailModal';

export default function AdminDashboard({ activeTab }) {
  const { user } = useAuth();
  const { users, pendingUsers, stats: userStats, loading: usersLoading } = useUsers();
  const { parcels, stats: parcelStats } = useParcels('admin', user?.uid, user?.email);
  const { devices, stats: deviceStats } = useDevices();
  
  const [processing, setProcessing] = useState(null);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleApproveUser = async (uid) => {
    setProcessing(uid);
    try {
      await update(ref(database, `users/${uid}/profile`), {
        verified: true
      });
      alert('✅ User approved successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to approve user');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectUser = async (uid) => {
    if (!confirm('Are you sure you want to reject this user?')) return;
    
    setProcessing(uid);
    try {
      await update(ref(database, `users/${uid}/profile`), {
        verified: false,
        banned: true
      });
      alert('User rejected and banned');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to reject user');
    } finally {
      setProcessing(null);
    }
  };

  // Dashboard Tab
  if (activeTab === 'dashboard') {
    return (
      <div className="p-6 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System overview and management</p>
        </div>

        <DashboardStats 
          stats={[
            { label: 'Total Users', value: userStats.total, icon: Users, color: 'primary' },
            { label: 'Active Parcels', value: parcelStats.inTransit, icon: Package, color: 'orange' },
            { label: 'Total Devices', value: deviceStats.total, icon: HardDrive, color: 'green' },
            { label: 'Pending Approval', value: userStats.pending, icon: CheckCircle, color: 'purple' },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* User Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">User Distribution</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-primary-50 rounded-lg">
                <span className="text-gray-700">Admins</span>
                <span className="text-2xl font-bold text-primary-600">{userStats.admins}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Warehouse Managers</span>
                <span className="text-2xl font-bold text-blue-600">{userStats.warehouse}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-gray-700">Transport Agents</span>
                <span className="text-2xl font-bold text-orange-600">{userStats.transporters}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Parcel Owners</span>
                <span className="text-2xl font-bold text-green-600">{userStats.owners}</span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">System Health</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Online Devices</span>
                <span className="text-2xl font-bold text-green-600">
                  {deviceStats.available + deviceStats.assigned}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-gray-700">Offline Devices</span>
                <span className="text-2xl font-bold text-red-600">{deviceStats.offline}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Total Parcels</span>
                <span className="text-2xl font-bold text-blue-600">{parcelStats.total}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Delivered</span>
                <span className="text-2xl font-bold text-green-600">{parcelStats.delivered}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals Alert */}
        {pendingUsers.length > 0 && (
          <div className="mt-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{pendingUsers.length}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-900">Pending User Approvals</h3>
                <p className="text-sm text-yellow-700">
                  {pendingUsers.length} user{pendingUsers.length > 1 ? 's' : ''} waiting for verification
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('users')}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
            >
              Review Requests
            </button>
          </div>
        )}
      </div>
    );
  }

  // Users Tab
  if (activeTab === 'users') {
    return (
      <div className="p-6 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Approve or reject user registrations</p>
        </div>

        {/* Pending Approvals */}
        {pendingUsers.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
              <CheckCircle size={20} />
              Pending Approvals ({pendingUsers.length})
            </h3>
            <div className="space-y-3">
              {pendingUsers.map(u => (
                <div key={u.uid} className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="font-medium text-gray-900">{u.email}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs px-2 py-1 bg-primary-100 text-primary-800 rounded-full capitalize font-medium">
                        {u.role}
                      </span>
                      <span className="text-xs text-gray-500">
                        Registered: {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveUser(u.uid)}
                      disabled={processing === u.uid}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectUser(u.uid)}
                      disabled={processing === u.uid}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">All Users ({users.length})</h3>
          </div>
          
          {usersLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 capitalize">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.banned ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            Banned
                          </span>
                        ) : u.verified ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Parcels Tab
  if (activeTab === 'parcels') {
    const filteredParcels = searchTerm
      ? parcels.filter(p => 
          p.info?.parcelId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.info?.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.info?.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : parcels;

    return (
      <div className="p-6 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">All Parcels</h1>
          <p className="text-gray-600 mt-1">Monitor all parcels across the system</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by Parcel ID, destination, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{parcelStats.total}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200 text-center">
            <p className="text-sm text-blue-700">Ready</p>
            <p className="text-2xl font-bold text-blue-900">{parcelStats.ready}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg shadow-sm border border-purple-200 text-center">
            <p className="text-sm text-purple-700">Assigned</p>
            <p className="text-2xl font-bold text-purple-900">{parcelStats.assigned}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg shadow-sm border border-orange-200 text-center">
            <p className="text-sm text-orange-700">In Transit</p>
            <p className="text-2xl font-bold text-orange-900">{parcelStats.inTransit}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200 text-center">
            <p className="text-sm text-green-700">Delivered</p>
            <p className="text-2xl font-bold text-green-900">{parcelStats.delivered}</p>
          </div>
        </div>

        {/* Parcels Grid */}
        {filteredParcels.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">No Parcels Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search' : 'No parcels in the system yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredParcels.map(parcel => (
              <ParcelCard
                key={parcel.id}
                parcel={parcel}
                onClick={() => setSelectedParcel(parcel)}
                role="admin"
              />
            ))}
          </div>
        )}

        {selectedParcel && (
          <ParcelDetailModal
            parcel={selectedParcel}
            onClose={() => setSelectedParcel(null)}
            role="admin"
          />
        )}
      </div>
    );
  }

  // Devices Tab
  if (activeTab === 'devices') {
    return <DevicePoolView />;
  }

  // Analytics Tab (Coming Soon)
  if (activeTab === 'analytics') {
    return (
      <div className="p-6 animate-fade-in">
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <BarChart3 className="mx-auto text-primary-400 mb-4" size={64} />
          <h3 className="text-2xl font-semibold mb-2 text-gray-900">Analytics Dashboard</h3>
          <p className="text-gray-600 mb-6">
            Advanced analytics and reporting features coming soon!
          </p>
          <div className="max-w-md mx-auto text-left space-y-2 text-sm text-gray-600">
            <p>• 📊 Real-time system performance metrics</p>
            <p>• 📈 Delivery success rate tracking</p>
            <p>• 🗺️ Route optimization insights</p>
            <p>• 📉 Alert trend analysis</p>
            <p>• 💰 Cost and efficiency reports</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}