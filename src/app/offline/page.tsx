import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="flex justify-center mb-6">
          <WifiOff size={64} className="text-gray-400" />
        </div>
        <h1 className="text-3xl font-bold mb-4">You&apos;re Offline</h1>
        <p className="text-gray-600 mb-8">
          It looks like you&apos;ve lost your internet connection. 
          Please check your connection and try again.
        </p>
        <div className="flex justify-center space-x-4">
          <Button
            onClick={() => window.location.reload()}
            className="flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Link href="/">
            <Button variant="outline">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}