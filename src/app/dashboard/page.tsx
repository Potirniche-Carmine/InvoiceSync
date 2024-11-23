'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if authToken cookie exists on the client
    const cookies = document.cookie.split('; ');
    const authToken = cookies.find((cookie) => cookie.startsWith('authToken='));

    // If no token, redirect to the sign-in page
    if (!authToken) {
      router.push('/signin');
    }
  }, [router]);

  const handleLogout = () => {
    // Clear the auth token
    document.cookie = 'authToken=; Max-Age=0; path=/;';
    router.push('/signin'); // Redirect to the sign-in page after logout
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <header className="w-full bg-indigo-600 text-white py-4 px-6 flex justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 focus:outline-none"
        >
          Logout
        </button>
      </header>
      <main className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6 mt-6">
        <h2 className="text-2xl font-bold mb-4">Welcome to Your Dashboard</h2>
        <p>This content is protected and only visible to logged-in users.</p>
      </main>
    </div>
  );
}
