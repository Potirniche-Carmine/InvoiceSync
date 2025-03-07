'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function SessionCheck() {
  const { status } = useSession();
  const pathname = usePathname();
  
  useEffect(() => {
    console.log('SessionCheck: Status:', status, 'Pathname:', pathname);
    
    if (status === 'authenticated' && pathname === '/') {
      console.log('Redirecting to dashboard...');
      window.location.href = '/dashboard';
    }
  }, [status, pathname]);

  return null;
}