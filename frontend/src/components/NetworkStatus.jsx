import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored!', {
        duration: 3000,
        icon: '🔗'
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Some features may not work.', {
        duration: 5000,
        icon: '📶'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50">
      <div className="flex items-center justify-center space-x-2">
        <span className="animate-pulse">📶</span>
        <span className="font-medium">No internet connection</span>
      </div>
    </div>
  );
};

export default NetworkStatus;
