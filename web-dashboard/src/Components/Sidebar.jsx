import { useState } from 'react';
import { Package, LayoutDashboard, Truck, BarChart3, Users, HardDrive, LogOut, Settings } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { useAuth } from '../hooks/useAuth';
import UserSettingsModal from './modals/UserSettingsModal';

export default function Sidebar({ userProfile, activeTab, setActiveTab, stats }) {
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  const getNavItems = () => {
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'warehouse', 'transporter', 'owner'] },
      { id: 'parcels', label: 'Parcels', icon: Package, roles: ['admin', 'warehouse', 'transporter', 'owner'] },
    ];

    if (userProfile?.role === 'admin') {
      items.push(
        { id: 'users', label: 'Users', icon: Users, roles: ['admin'] },
        { id: 'devices', label: 'Devices', icon: HardDrive, roles: ['admin'] },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] }
      );
    }

    if (userProfile?.role === 'warehouse') {
      items.push(
        { id: 'devices', label: 'Device Pool', icon: HardDrive, roles: ['warehouse'] }
      );
    }

    if (userProfile?.role === 'transporter') {
      items.push(
        { id: 'transport', label: 'Available', icon: Truck, roles: ['transporter'] }
      );
    }

    return items.filter(item => item.roles.includes(userProfile?.role));
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      warehouse: 'bg-blue-100 text-blue-800',
      transporter: 'bg-orange-100 text-orange-800',
      owner: 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <Package className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">TRACEON</h1>
            <p className="text-xs text-gray-600">Smart Logistics</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {getNavItems().map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-primary-50 text-primary-600 font-medium shadow-sm border-l-4 border-primary-600 pl-3'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Stats */}
        {stats && (
          <div className="px-6 py-4 border-t border-gray-200 space-y-2 bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Active Parcels</span>
              <span className="font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-xs">
                {stats.active || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Devices</span>
              <span className="font-semibold text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full text-xs">
                {stats.devices || 0}
              </span>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
              {userProfile?.photoURL ? (
                <img 
                  src={userProfile.photoURL} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userProfile?.name || user?.email}
              </p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(userProfile?.role)}`}>
                {userProfile?.role}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowSettings(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-white hover:text-gray-900 rounded-lg transition-all border border-gray-200"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button 
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all border border-red-200"
              title="Logout"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="grid grid-cols-4 h-16">
          {getNavItems().slice(0, 4).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 ${
                activeTab === item.id 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-600 hover:bg-gray-50'
              } transition-all`}
            >
              <item.icon size={20} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 bg-white border-b border-gray-200 z-40 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Package className="text-white" size={16} />
            </div>
            <h1 className="text-lg font-bold text-gray-900">TRACEON</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <UserSettingsModal
          user={user}
          userProfile={userProfile}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}