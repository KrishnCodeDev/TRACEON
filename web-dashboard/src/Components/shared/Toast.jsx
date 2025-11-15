import { useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-800'
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-50 border-red-200 text-red-800'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-800'
  }
};

export function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const { icon: Icon, className } = TOAST_TYPES[type] || TOAST_TYPES.info;

  return (
    <div className={`fixed bottom-4 right-4 z-50 animate-slide-up ${className} border rounded-lg shadow-lg max-w-sm`}>
      <div className="px-4 py-3 flex items-center gap-3">
        <Icon size={20} />
        <p className="flex-1">{message}</p>
        <button
          onClick={onClose}
          className="p-1 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>
  );
}