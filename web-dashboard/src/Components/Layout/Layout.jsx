import { useState, useEffect } from 'react';
import { Bell, LogOut, X, Package } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { useNotifications } from '../../hooks/useNotifications';

export default function Layout({ children, user, userProfile }) {
  const { notifications, unreadCount } = useNotifications(user?.uid);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleLogout = async () => {
    try { 
      await signOut(auth); 
    } catch (error) { 
      console.error('Logout error:', error);
      alert('Failed to logout');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '--';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="text-indigo-600" size={32} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Logistics Monitor</h1>
                <p className="text-sm text-gray-600 capitalize">{userProfile?.role || 'User'} Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)} 
                  className="relative p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Bell size={20} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b flex justify-between items-center">
                      <h3 className="font-semibold">Notifications</h3>
                      <button onClick={() => setShowNotifications(false)}>
                        <X size={18} />
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-4 border-b hover:bg-gray-50 ${!n.read ? 'bg-blue-50' : ''}`}
                        >
                          <p className="text-sm font-medium">{n.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatTime(n.timestamp)}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 pl-3 border-l">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{userProfile?.role}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}