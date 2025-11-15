import { HardDrive, CheckCircle, AlertCircle, XCircle, Activity } from 'lucide-react';
import { useDevices } from '../../hooks/useDevices';

export default function DevicePoolView() {
  const { devices, stats, loading } = useDevices();

  const getStatusIcon = (status) => {
    switch(status) {
      case 'available':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'assigned':
        return <Activity className="text-blue-600" size={20} />;
      case 'offline':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <AlertCircle className="text-gray-600" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'available':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'assigned':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'offline':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // ✅ FIX: Format timestamp correctly
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    const ts = parseInt(timestamp);
    if (ts === 0 || isNaN(ts)) return 'Never';
    return new Date(ts).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="bg-white rounded-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Device Pool</h1>
        <p className="text-gray-600 mt-1">Manage TRACEON device availability</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Devices</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <HardDrive className="text-primary-600" size={32} />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg shadow-sm p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Available</p>
              <p className="text-3xl font-bold text-green-900">{stats.available}</p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg shadow-sm p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Assigned</p>
              <p className="text-3xl font-bold text-blue-900">{stats.assigned}</p>
            </div>
            <Activity className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg shadow-sm p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">Offline</p>
              <p className="text-3xl font-bold text-red-900">{stats.offline}</p>
            </div>
            <XCircle className="text-red-600" size={32} />
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-primary-900 mb-2">💡 How Device Assignment Works</h3>
        <ul className="text-sm text-primary-800 space-y-1">
          <li>• <strong>Available:</strong> Device is online and ready for assignment</li>
          <li>• <strong>Assigned:</strong> Device is currently monitoring a parcel</li>
          <li>• <strong>Offline:</strong> Device hasn't reported in the last 2 minutes</li>
          <li>• Power on a TRACEON device and it will auto-register here within seconds</li>
        </ul>
      </div>

      {/* Devices List */}
      {devices.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <HardDrive className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold mb-2 text-gray-900">No Devices Registered</h3>
          <p className="text-gray-600">Power on TRACEON devices to see them here</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Device ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Seen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Temperature
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Humidity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {devices.map(device => (
                  <tr 
                    key={device.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(device.info.status)}
                        <span className="font-medium text-gray-900">{device.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(device.info.status)}`}>
                        {device.info.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {device.info?.assignedParcelId && device.info.assignedParcelId.trim() ? 
                          device.info.assignedParcelId : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {/* ✅ FIX: Parse timestamp before display */}
                      {formatLastSeen(device.info.lastSeen)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {device.current?.temperature?.toFixed(1) || '--'}°C
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {device.current?.humidity?.toFixed(1) || '--'}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}