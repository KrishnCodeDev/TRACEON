import { toast } from 'react-hot-toast';

const defaultStyles = {
  borderRadius: '10px',
  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
  padding: '16px',
  marginBottom: '8px',
};

export function useToast() {
  const showSuccess = (message, duration = 3000) => {
    return toast.success(message, {
      duration,
      style: {
        ...defaultStyles,
        background: '#10B981',
        color: '#FFFFFF',
      },
    });
  };

  const showError = (message, duration = 3000) => {
    return toast.error(message, {
      duration,
      style: {
        ...defaultStyles,
        background: '#EF4444',
        color: '#FFFFFF',
      },
    });
  };

  const showWarning = (message, duration = 3000) => {
    return toast(message, {
      duration,
      icon: '⚠️',
      style: {
        ...defaultStyles,
        background: '#FEF3C7',
        color: '#92400E',
        border: '1px solid #F59E0B',
      },
    });
  };

  const showInfo = (message, duration = 3000) => {
    return toast(message, {
      duration,
      icon: 'ℹ️',
      style: {
        ...defaultStyles,
        background: '#EFF6FF',
        color: '#1E40AF',
        border: '1px solid #3B82F6',
      },
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}