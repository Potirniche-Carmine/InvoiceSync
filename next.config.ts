/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Add these configurations
  images: {
    unoptimized: true
  },
  experimental: {
    outputFileTracingIncludes: {
      '/app/fonts/**/*': true,  // For your local fonts
      '/public/**/*': true      // For public assets
    }
  }
};

export default nextConfig;