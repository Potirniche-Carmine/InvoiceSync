'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';

export default function SessionCheck() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [, setIsChecking] = useState(true);
  
  useEffect(() => {
    if (status === 'loading') return;
    
    console.log('SessionCheck: Status:', status, 'Pathname:', pathname);
    
    setIsChecking(false);
    
    if (status === 'authenticated' && pathname === '/') {
      router.push('/dashboard');
    }
  }, [status, pathname, router]);

  return null;
}