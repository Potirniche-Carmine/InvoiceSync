'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

export function RefreshButton() {
  return (
    <button 
      onClick={() => window.location.reload()}
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow flex items-center"
    >
      <RefreshCw className="mr-2 h-4 w-4" />
      Refresh
    </button>
  );
}