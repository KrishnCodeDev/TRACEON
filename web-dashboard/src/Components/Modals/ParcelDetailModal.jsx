import { useState, useEffect } from 'react';
import { X, Thermometer, Droplets, Activity, AlertTriangle, TrendingUp, Package, MapPin, User, Trash2 } from 'lucide-react';
import { ref, onValue, remove, update, set } from 'firebase/database';
import { database } from '../../utils/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from '../../hooks/useToast';

export default function ParcelDetailModal({ parcel, onClose, role }) {
  const { showSuccess, showError, showWarning } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [chartData, setChartData] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [assigningAgent, setAssigningAgent] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [realTimeAlerts, setRealTimeAlerts] = useState([]);

  // ✅ FIX: Subscribe to device's current data
  useEffect(() => {
    if (!parcel?.info?.deviceId) {
      setLoading(false);
      return;
    }

    const currentRef = ref(database, `SmartParcels/${parcel.info.deviceId}/current`);
    const historyRef = ref(database, `SmartParcels/${parcel.info.deviceId}/history`);
    const alertsRef = ref(database, `SmartParcels/${parcel.info.deviceId}/alerts`);
    
    // Subscribe to current data
    const currentUnsub = onValue(currentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log('[MODAL] Current data received:', data);
        setCurrentData(data);
      }
    });

    // Subscribe to alerts
    const alertsUnsub = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const alertsList = Object.entries(data).map(([id, alert]) => ({
          id,
          ...alert,
          timestamp: alert.timestamp || Date.now()
        }));
        setRealTimeAlerts(alertsList.sort((a, b) => b.timestamp - a.timestamp));

        // Show toast for new critical alerts
        const criticalAlerts = alertsList.filter(a => a.severity === 'critical' && !a.resolved);
        if (criticalAlerts.length > 0) {
          criticalAlerts.forEach(alert => {
            showWarning(`🚨 Critical Alert: ${alert.message}`);
          });
        }
      }
    });

    // Subscribe to history data
    const historyUnsub = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        console.log('[MODAL] History data received:', Object.keys(data).length, 'entries');
        const chartArray = Object.entries(data)
          .map(([key, value]) => {
            const timestamp = parseInt(value.timestamp) || 0;
            return {
              timestamp,
              time: timestamp > 0 
                ? new Date(timestamp).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })
                : '--',
              temperature: parseFloat(value.temperature) || 0,
              humidity: parseFloat(value.humidity) || 0,
              heatIndex: parseFloat(value.heatIndex) || 0,
              accelX: parseFloat(value.accelX) || 0,
              accelY: parseFloat(value.accelY) || 0,
              accelZ: parseFloat(value.accelZ) || 0,
              gyroX: parseFloat(value.gyroX) || 0,
              gyroY: parseFloat(value.gyroY) || 0,
              gyroZ: parseFloat(value.gyroZ) || 0
            };
          })
          .filter(item => item.timestamp > 0)
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-50);

        console.log('[MODAL] Chart data processed:', chartArray.length, 'points');
        setChartData(chartArray);
      } else {
        console.log('[MODAL] No history data available');
      }
      setLoading(false);
    });

    return () => {
      currentUnsub();
      historyUnsub();
      alertsUnsub();
    };
  }, [parcel?.info?.deviceId]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '--';
    const ts = parseInt(timestamp);
    return ts > 0 ? new Date(ts).toLocaleString() : '--';
  };

  const handleDeleteParcel = async () => {
    if (!confirm(`⚠️ Are you sure you want to delete parcel ${parcel.info?.parcelId}?\n\nThis will:\n- Remove the parcel from the system\n- Unassign the TRACEON device\n- This action CANNOT be undone!`)) {
      return;
    }

    setDeleting(true);
    try {
      if (parcel.info?.deviceId) {
        await update(ref(database, `SmartParcels/${parcel.info.deviceId}/info`), {
          status: 'available',
          assignedParcelId: ''
        });
      }

      await remove(ref(database, `parcels/${parcel.id}`));
      showSuccess('Parcel deleted successfully!');
      onClose();
    } catch (error) {
      console.error('Error deleting parcel:', error);
      showError('Failed to delete parcel: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleAssignAgent = async (agentId) => {
    if (!confirm(`Assign this agent to parcel ${parcel.info?.parcelId}?`)) return;
    setAssigningAgent(agentId);
    try {
      // Update parcel info to set transporter and mark as assigned
      await update(ref(database, `parcels/${parcel.id}/info`), {
        transporterId: agentId,
        status: 'assigned',
        assignedAt: Date.now()
      });

      // Notify the agent about assignment
      await set(ref(database, `users/${agentId}/notifications/${Date.now()}`), {
        type: 'assignment',
        message: `You have been assigned parcel ${parcel.info?.parcelId}`,
        parcelId: parcel.id,
        timestamp: Date.now(),
        read: false
      });

      // Optionally remove their interest entry
      try { await remove(ref(database, `parcels/${parcel.id}/interestedAgents/${agentId}`)); } catch (e) { /* non-fatal */ }

      showSuccess('Agent assigned successfully');
      // Close modal to refresh parent listing; parent components listen to DB changes
      onClose();
    } catch (error) {
      console.error('Assign error:', error);
      showError('Failed to assign agent: ' + (error.message || error));
    } finally {
      setAssigningAgent(null);
    }
  };

  // Combine alerts from parcel data and real-time alerts
  const allAlerts = [
    ...(parcel.alerts ? Object.entries(parcel.alerts).map(([id, alert]) => ({ id, ...alert })) : []),
    ...realTimeAlerts
  ];
  
  const unresolvedAlerts = allAlerts
    .filter(a => !a.resolved)
    .sort((a, b) => b.timestamp - a.timestamp);

  // Remove duplicates by alert ID
  const uniqueUnresolvedAlerts = unresolvedAlerts.reduce((unique, alert) => {
    if (!unique.find(a => a.id === alert.id)) {
      unique.push(alert);
    }
    return unique;
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white p-6 sticky top-0 z-10 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{parcel.info?.parcelId}</h2>
              <p className="text-sm opacity-90 mt-1">{parcel.info?.productDescription}</p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex gap-4 mt-4 border-b border-white border-opacity-20">
            {['overview', 'charts', 'alerts', 'journey'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium capitalize transition-all ${
                  activeTab === tab ? 'border-b-2 border-white text-white' : 'text-white text-opacity-70 hover:text-opacity-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package size={18} />
                    Parcel Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Parcel ID:</span>
                      <span className="font-medium">{parcel.info?.parcelId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium capitalize">{parcel.info?.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weight:</span>
                      <span className="font-medium">{parcel.info?.weight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className={`font-medium capitalize ${
                        parcel.info?.priority === 'urgent' ? 'text-red-600' :
                        parcel.info?.priority === 'high' ? 'text-orange-600' : 'text-gray-900'
                      }`}>
                        {parcel.info?.priority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Device:</span>
                      <span className="font-medium text-xs">{parcel.info?.deviceId}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin size={18} />
                    Location Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600 block">From:</span>
                      <span className="font-medium">{parcel.info?.pickupLocation}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">To:</span>
                      <span className="font-medium">{parcel.info?.destination}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User size={18} />
                    Owner Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{parcel.info?.ownerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-xs">{parcel.info?.ownerEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{parcel.info?.ownerPhone}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Activity size={18} />
                    Current Conditions
                  </h3>
                  {currentData ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Thermometer className="text-red-500" size={16} />
                          <span className="text-sm text-gray-600">Temperature</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                          {currentData.temperature?.toFixed(1)}°C
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Droplets className="text-blue-500" size={16} />
                          <span className="text-sm text-gray-600">Humidity</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                          {currentData.humidity?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="text-orange-500" size={16} />
                          <span className="text-sm text-gray-600">Heat Index</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                          {currentData.heatIndex?.toFixed(1)}°C
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Orientation</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {currentData.orientation}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Last updated: {formatTime(currentData.timestamp)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No current data available</p>
                  )}
                </div>
              </div>
                
                {/* Interested Agents (warehouse/admin only) */}
                {(role === 'warehouse' || role === 'admin') && parcel.interestedAgents && Object.keys(parcel.interestedAgents).length > 0 && (
                  <div className="bg-white rounded-lg p-4 border">
                    <h3 className="font-semibold mb-3">Interested Agents</h3>
                    <div className="space-y-3">
                      {Object.entries(parcel.interestedAgents).map(([agentId, info]) => (
                        <div key={agentId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{info.agentName || info.agentEmail}</p>
                            <p className="text-sm text-gray-600">{info.agentEmail} • ETA: {info.eta || 'N/A'}</p>
                            <p className="text-xs text-gray-500 mt-1">{info.note}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              disabled={parcel.info?.transporterId || assigningAgent}
                              onClick={() => handleAssignAgent(agentId)}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              {assigningAgent === agentId ? 'Assigning...' : 'Assign'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {parcel.info?.specialInstructions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Special Instructions</h3>
                  <p className="text-sm text-yellow-800">{parcel.info.specialInstructions}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'charts' && (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading sensor data...</p>
                </div>
              ) : chartData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Activity size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="font-semibold mb-2">No Historical Data Yet</p>
                  <p className="text-sm">Device is collecting data. Charts will appear in a few seconds.</p>
                  <p className="text-xs text-gray-400 mt-2">Data uploads every 2 seconds from the device</p>
                </div>
              ) : (
                <>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">🌡️ Temperature (°C)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} domain={['dataMin - 2', 'dataMax + 2']} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="temperature" stroke="#ef4444" name="Temperature" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">💧 Humidity (%)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="humidity" stroke="#3b82f6" name="Humidity" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">📊 Acceleration X (m/s²)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="accelX" stroke="#ef4444" name="Accel X" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">📊 Acceleration Y (m/s²)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="accelY" stroke="#10b981" name="Accel Y" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">📊 Acceleration Z (m/s²)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="accelZ" stroke="#3b82f6" name="Accel Z" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">🔄 Gyroscope X (rad/s)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="gyroX" stroke="#ef4444" name="Gyro X" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">🔄 Gyroscope Y (rad/s)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="gyroY" stroke="#10b981" name="Gyro Y" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">🔄 Gyroscope Z (rad/s)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="gyroZ" stroke="#3b82f6" name="Gyro Z" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {uniqueUnresolvedAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">✓</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
                  <p className="text-gray-600">No active alerts for this parcel</p>
                </div>
              ) : (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-2">
                      🚨 {uniqueUnresolvedAlerts.length} Active Alert{uniqueUnresolvedAlerts.length > 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-red-700">Immediate attention required</p>
                  </div>

                  {uniqueUnresolvedAlerts.map(alert => (
                    <div key={alert.id} className={`rounded-lg border p-4 ${
                      alert.severity === 'critical' ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'
                    }`}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'} size={24} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 uppercase text-sm">{alert.type}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              alert.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
                            }`}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                          {alert.value && (
                            <p className="text-xs text-gray-600">
                              Current: <span className="font-semibold">{alert.value}</span>
                              {alert.threshold && ` | Threshold: ${alert.threshold}`}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">{formatTime(alert.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {activeTab === 'journey' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Delivery Timeline</h3>
              
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-8">
                  {parcel.info?.createdAt && (
                    <div className="relative pl-12">
                      <div className="absolute left-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Package className="text-white" size={16} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Parcel Created</h4>
                        <p className="text-sm text-gray-600">{formatTime(parcel.info.createdAt)}</p>
                        <p className="text-xs text-gray-500 mt-1">Warehouse: {parcel.info?.pickupLocation}</p>
                      </div>
                    </div>
                  )}

                  {parcel.info?.assignedAt && (
                    <div className="relative pl-12">
                      <div className="absolute left-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <User className="text-white" size={16} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Transport Assigned</h4>
                        <p className="text-sm text-gray-600">{formatTime(parcel.info.assignedAt)}</p>
                      </div>
                    </div>
                  )}

                  {parcel.info?.pickedUpAt && (
                    <div className="relative pl-12">
                      <div className="absolute left-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Package className="text-white" size={16} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Picked Up</h4>
                        <p className="text-sm text-gray-600">{formatTime(parcel.info.pickedUpAt)}</p>
                      </div>
                    </div>
                  )}

                  {parcel.info?.dispatchedAt && (
                    <div className="relative pl-12">
                      <div className="absolute left-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <Activity className="text-white" size={16} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">In Transit</h4>
                        <p className="text-sm text-gray-600">{formatTime(parcel.info.dispatchedAt)}</p>
                        <p className="text-xs text-gray-500 mt-1">En route to destination</p>
                      </div>
                    </div>
                  )}

                  {parcel.info?.deliveredAt ? (
                    <div className="relative pl-12">
                      <div className="absolute left-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-900">Delivered</h4>
                        <p className="text-sm text-gray-600">{formatTime(parcel.info.deliveredAt)}</p>
                        <p className="text-xs text-gray-500 mt-1">Destination: {parcel.info?.destination}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative pl-12">
                      <div className="absolute left-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center animate-pulse">
                        <Activity className="text-gray-600" size={16} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-600">Awaiting Delivery</h4>
                        <p className="text-sm text-gray-500">In progress...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex gap-3 rounded-b-xl border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
          >
            Close
          </button>
          
          {(role === 'warehouse' || role === 'admin') && parcel.info?.status !== 'delivered' && (
            <button
              onClick={handleDeleteParcel}
              disabled={deleting}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  Delete Parcel
                </>
              )}
            </button>
          )}
          
          <button className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors">
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}