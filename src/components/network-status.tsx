'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <Alert variant="destructive" className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50">
      <WifiOff className="h-4 w-4 mr-2" />
      <AlertDescription>
        You are currently offline. Some features may be unavailable.
      </AlertDescription>
    </Alert>
  );
}