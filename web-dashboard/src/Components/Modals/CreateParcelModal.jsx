import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { ref, set, update } from 'firebase/database';
import { database } from '../../utils/firebase';

export default function CreateParcelModal({ availableDevices, onClose, warehouseId }) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  
  // ✅ FIX 1: Only show devices with status='available' and isOnline=true
  const selectableDevices = availableDevices.filter(d => 
    d.info?.status === 'available' && d.info?.isOnline === true
  );
  
  const [formData, setFormData] = useState({
    productDescription: '',
    category: 'electronics',
    weight: '',
    length: '',
    width: '',
    height: '',
    pickupLocation: '',
    destination: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    deviceId: '',
    priority: 'normal',
    specialInstructions: '',
    tempMin: '5',
    tempMax: '40',
    humidityMin: '20',
    humidityMax: '80',
    vibrationThreshold: '15'
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectableDevices.length === 0) {
      setError('No available devices. Please power on a TRACEON device first.');
      return;
    }

    if (!formData.deviceId) {
      setError('Please select a TRACEON device');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const parcelId = `PKG${Date.now().toString().slice(-8)}`;
      const now = Date.now();

      // Create parcel data
      const parcelData = {
        info: {
          parcelId,
          deviceId: formData.deviceId,
          productDescription: formData.productDescription,
          category: formData.category,
          weight: parseFloat(formData.weight) || 0,
          dimensions: {
            l: parseFloat(formData.length) || 0,
            w: parseFloat(formData.width) || 0,
            h: parseFloat(formData.height) || 0
          },
          pickupLocation: formData.pickupLocation,
          destination: formData.destination,
          ownerName: formData.ownerName,
          ownerEmail: formData.ownerEmail,
          ownerPhone: formData.ownerPhone,
          warehouseId: warehouseId,
          transporterId: null,
          ownerId: formData.ownerEmail,
          status: 'ready',
          priority: formData.priority,
          specialInstructions: formData.specialInstructions,
          createdAt: now,
          assignedAt: null,
          pickedUpAt: null,
          dispatchedAt: null,
          deliveredAt: null,
          thresholds: {
            temperature: {
              min: parseFloat(formData.tempMin) || 5,
              max: parseFloat(formData.tempMax) || 40
            },
            humidity: {
              min: parseFloat(formData.humidityMin) || 20,
              max: parseFloat(formData.humidityMax) || 80
            },
            vibration: parseFloat(formData.vibrationThreshold) || 15
          }
        },
        interestedAgents: {}
      };

      // Save parcel
      await set(ref(database, `parcels/${parcelId}`), parcelData);

      // ✅ FIX 1: Update device thresholds with parcel custom thresholds
      await update(ref(database, `SmartParcels/${formData.deviceId}/info`), {
        status: 'assigned',
        assignedParcelId: parcelId,
        lastSeen: now.toString(),
        thresholds: {
          temperature: {
            min: parseFloat(formData.tempMin) || 5,
            max: parseFloat(formData.tempMax) || 40
          },
          humidity: {
            min: parseFloat(formData.humidityMin) || 20,
            max: parseFloat(formData.humidityMax) || 80
          },
          vibration: parseFloat(formData.vibrationThreshold) || 15
        }
      });

      // ✅ FIX 2: Clear old alerts and history for this device
      await set(ref(database, `SmartParcels/${formData.deviceId}/alerts`), {});
      await set(ref(database, `SmartParcels/${formData.deviceId}/history`), {});
      
      // Re-initialize current data
      await set(ref(database, `SmartParcels/${formData.deviceId}/current`), {
        timestamp: now.toString(),
        temperature: 0,
        humidity: 0,
        accelX: 0,
        accelY: 0,
        accelZ: 0,
        gyroX: 0,
        gyroY: 0,
        gyroZ: 0,
        orientation: 'Initializing'
      });

      // Create notification for owner
      const ownerNotifId = `${now}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        await set(ref(database, `users/${formData.ownerEmail.replace(/[.#$[\]]/g, '_')}/notifications/${ownerNotifId}`), {
          type: 'parcel_created',
          message: `New parcel ${parcelId} created for delivery to ${formData.destination}`,
          parcelId: parcelId,
          timestamp: now,
          read: false
        });
      } catch (e) {
        console.warn('Could not send owner notification:', e);
      }

      alert('✅ Parcel created successfully!');
      onClose();
    } catch (error) {
      console.error('Error creating parcel:', error);
      setError(`Failed to create parcel: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white p-6 sticky top-0 z-10 flex justify-between items-center rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold">Create New Parcel</h2>
            <p className="text-sm opacity-90 mt-1">Assign a TRACEON device and configure monitoring</p>
          </div>
          <button
            onClick={onClose}
            disabled={creating}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Device Selection */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📡 TRACEON Device Assignment</h3>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Available Device *
              </label>
              {availableDevices.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-yellow-800 font-medium mb-2">No devices available</p>
                  <p className="text-xs text-yellow-700">
                    Power on a TRACEON device and wait for it to register (check Serial Monitor for MAC address)
                  </p>
                </div>
              ) : (
                <select
                  required
                  value={formData.deviceId}
                  onChange={(e) => handleChange('deviceId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">-- Select Device --</option>
                  {selectableDevices.map(device => {
                    // ✅ FIX: Parse timestamp before displaying
                    const lastSeenTime = parseInt(device.info?.lastSeen) || 0;
                    const displayTime = lastSeenTime > 0 
                      ? new Date(lastSeenTime).toLocaleTimeString()
                      : 'Never';
                    
                    return (
                      <option key={device.id} value={device.id}>
                        {device.id} (Last seen: {displayTime})
                      </option>
                    );
                  })}
                </select>
              )}
              <p className="text-xs text-gray-600">
                🟢 {selectableDevices.length} device{selectableDevices.length !== 1 ? 's' : ''} online and available
              </p>
            </div>
          </div>

          {/* Product Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 Product Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Description *</label>
                <input
                  type="text"
                  required
                  value={formData.productDescription}
                  onChange={(e) => handleChange('productDescription', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Samsung Galaxy S23, Medical Supplies"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="electronics">Electronics</option>
                    <option value="food">Food & Beverages</option>
                    <option value="medical">Medical</option>
                    <option value="fragile">Fragile Items</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.weight}
                    onChange={(e) => handleChange('weight', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions (cm) *</label>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.length}
                    onChange={(e) => handleChange('length', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Length"
                  />
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.width}
                    onChange={(e) => handleChange('width', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Width"
                  />
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.height}
                    onChange={(e) => handleChange('height', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Height"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📍 Location Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location *</label>
                <input
                  type="text"
                  required
                  value={formData.pickupLocation}
                  onChange={(e) => handleChange('pickupLocation', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Mumbai Warehouse A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destination *</label>
                <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={(e) => handleChange('destination', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Delhi Hub B"
                />
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 Owner Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name *</label>
                <input
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={(e) => handleChange('ownerName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner Email *</label>
                <input
                  type="email"
                  required
                  value={formData.ownerEmail}
                  onChange={(e) => handleChange('ownerEmail', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="owner@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.ownerPhone}
                  onChange={(e) => handleChange('ownerPhone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+91 9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sensor Thresholds */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎛️ Monitoring Thresholds</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Temperature (°C)</label>
                <input
                  type="number"
                  value={formData.tempMin}
                  onChange={(e) => handleChange('tempMin', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Temperature (°C)</label>
                <input
                  type="number"
                  value={formData.tempMax}
                  onChange={(e) => handleChange('tempMax', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Humidity (%)</label>
                <input
                  type="number"
                  value={formData.humidityMin}
                  onChange={(e) => handleChange('humidityMin', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Humidity (%)</label>
                <input
                  type="number"
                  value={formData.humidityMax}
                  onChange={(e) => handleChange('humidityMax', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Vibration Threshold (m/s²)</label>
                <input
                  type="number"
                  value={formData.vibrationThreshold}
                  onChange={(e) => handleChange('vibrationThreshold', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
            <textarea
              rows="3"
              value={formData.specialInstructions}
              onChange={(e) => handleChange('specialInstructions', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Handle with care, fragile items..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || selectableDevices.length === 0}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {creating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </span>
              ) : (
                'Create Parcel'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}