import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Landing from './components/Landing';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/dashboards/AdminDashboard';
import WarehouseDashboard from './components/dashboards/WarehouseDashboard';
import TransporterDashboard from './components/dashboards/TransporterDashboard';
import OwnerDashboard from './components/dashboards/OwnerDashboard';
import { useParcels } from './hooks/useParcels';
import { useDevices } from './hooks/useDevices';

function App() {
  const { user, userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  
  const { parcels } = useParcels(userProfile?.role, user?.uid, user?.email);
  const { devices } = useDevices();

  // Reset showLogin when user logs in
  useEffect(() => {
    if (user) {
      setShowLogin(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">Loading TRACEON...</p>
        </div>
      </div>
    );
  };

  if (!user) {
    if (loading) {
      return null; // or show a loading spinner
    }
    return showLogin ? (
      <Login onBack={() => setShowLogin(false)} />
    ) : (
      <Landing onGetStarted={() => setShowLogin(true)} />
    );
  }

  if (userProfile && !userProfile.verified && userProfile.role !== 'owner') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pending Verification</h2>
          <p className="text-gray-600 mb-6">
            Your {userProfile.role} account is awaiting admin approval. You'll be notified once verified.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    active: parcels.filter(p => ['ready', 'assigned', 'in_transit', 'picked_up'].includes(p.info?.status)).length,
    devices: devices.length
  };

  const renderDashboard = () => {
    switch(userProfile?.role) {
      case 'admin':
        return <AdminDashboard activeTab={activeTab} />;
      case 'warehouse':
        return <WarehouseDashboard activeTab={activeTab} />;
      case 'transporter':
        return <TransporterDashboard activeTab={activeTab} onTabChange={setActiveTab} />;
      case 'owner':
        return <OwnerDashboard activeTab={activeTab} />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-600">Invalid user role</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        userProfile={userProfile} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        stats={stats}
      />
      
      {/* Main Content */}
      <div className="lg:pl-64 pb-16 lg:pb-0">
        {renderDashboard()}
      </div>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#059669',
            },
          },
          error: {
            style: {
              background: '#DC2626',
            },
          },
        }}
      />
    </div>
  );
}

export default App;