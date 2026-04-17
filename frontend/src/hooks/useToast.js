import toast from 'react-hot-toast';

export const useToast = () => {
  const showError = (message, title = 'Error') => {
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
      },
    });
  };

  const showSuccess = (message, title = 'Success') => {
    toast.success(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
      },
    });
  };

  const showInfo = (message) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#3b82f6',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
      },
    });
  };

  return { showError, showSuccess, showInfo };
};

