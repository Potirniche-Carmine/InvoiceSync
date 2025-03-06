import React from 'react';
import Link from 'next/link';
import { WifiOff } from 'lucide-react';
import { RefreshButton } from '@/components/refresh-button';

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
          <RefreshButton />
          <Link href="/">
            <button className="bg-transparent hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded shadow">
              Go Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}