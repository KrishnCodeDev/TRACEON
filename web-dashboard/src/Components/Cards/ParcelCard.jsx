import { Package, MapPin, User, Thermometer, Droplets, AlertTriangle } from 'lucide-react';

export default function ParcelCard({ parcel, onClick, role }) {
  const getStatusColor = (status) => {
    const colors = {
      ready: 'bg-blue-100 text-blue-800 border-blue-200',
      assigned: 'bg-purple-100 text-purple-800 border-purple-200',
      picked_up: 'bg-orange-100 text-orange-800 border-orange-200',
      in_transit: 'bg-orange-100 text-orange-800 border-orange-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      normal: 'bg-gray-100 text-gray-800'
    };
    return colors[priority] || colors.normal;
  };

  const hasAlerts = parcel.alerts && Object.keys(parcel.alerts).length > 0;
  const unreadAlerts = hasAlerts ? Object.values(parcel.alerts).filter(a => !a.resolved).length : 0;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-purple-600 text-white p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-bold">{parcel.info?.parcelId}</h3>
            <p className="text-sm opacity-90 truncate">{parcel.info?.productDescription}</p>
          </div>
          {unreadAlerts > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse-slow">
              {unreadAlerts}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(parcel.info?.status)}`}>
            {(parcel.info?.status || 'unknown').replace('_', ' ').toUpperCase()}
          </span>
          {parcel.info?.priority !== 'normal' && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(parcel.info?.priority)}`}>
              {parcel.info?.priority.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin className="text-gray-400 flex-shrink-0 mt-0.5" size={16} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600">From: {parcel.info?.pickupLocation}</p>
            <p className="text-sm font-medium text-gray-900 truncate">To: {parcel.info?.destination}</p>
          </div>
        </div>

        {/* Owner */}
        <div className="flex items-center gap-2">
          <User className="text-gray-400 flex-shrink-0" size={16} />
          <p className="text-sm text-gray-600 truncate">{parcel.info?.ownerName || 'Unknown Owner'}</p>
        </div>

        {/* Current Conditions */}
        {parcel.current && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Thermometer className="text-red-500" size={16} />
              <div>
                <p className="text-xs text-gray-600">Temperature</p>
                <p className="text-sm font-semibold text-gray-900">
                  {parcel.current.temperature?.toFixed(1) || '--'}°C
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="text-blue-500" size={16} />
              <div>
                <p className="text-xs text-gray-600">Humidity</p>
                <p className="text-sm font-semibold text-gray-900">
                  {parcel.current.humidity?.toFixed(1) || '--'}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Banner */}
        {unreadAlerts > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2">
            <AlertTriangle className="text-red-600 flex-shrink-0" size={16} />
            <p className="text-xs text-red-600 font-medium">
              {unreadAlerts} active alert{unreadAlerts > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center group-hover:text-primary-600 transition-colors">
          Click to view details →
        </p>
      </div>
    </div>
  );
}