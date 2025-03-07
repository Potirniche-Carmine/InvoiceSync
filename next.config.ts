import nextPWA from '@ducanh2912/next-pwa';
const withPWA = nextPWA({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
  });

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  
  images: {
    unoptimized: false,
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
  
module.exports = withPWA(nextConfig);