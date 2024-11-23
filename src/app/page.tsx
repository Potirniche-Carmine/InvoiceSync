'use client';

import { useRouter } from 'next/navigation';

const HomePage = () => {
  const router = useRouter();

  const navigateToSignIn = () => {
    router.push('/signin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to Our App</h1>
        <p className="text-lg mb-8">Click the button below to sign in and access your dashboard.</p>
        <button
          onClick={navigateToSignIn}
          className="px-8 py-4 bg-indigo-600 text-white text-xl rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Go to Sign In
        </button>
      </div>
    </div>
  );
};

export default HomePage;