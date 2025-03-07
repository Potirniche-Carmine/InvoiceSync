'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';

export default function SessionCheck() {
  const router = useRouter();
  const [, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const session = await getSession();
      
      if (session) {
        if (window.location.pathname === '/') {
          router.replace('/dashboard');
        }
      }
      setIsChecking(false);
    }

    checkSession();
  }, [router]);

  return null;
}