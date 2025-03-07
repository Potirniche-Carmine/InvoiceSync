'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';

export default function SessionCheck() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPath = pathname === '/';
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (session && isAuthPath) {
      router.replace('/dashboard');
    }
    
    if (!session && !isAuthPath && !pathname.startsWith('/api')) {
      router.replace('/');
    }
  }, [session, status, router, pathname, isAuthPath]);

  return null;
}