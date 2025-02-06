/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true
  },
  experimental: {
    outputFileTracingIncludes: {
      '/app/fonts/**/*': true, 
      '/public/**/*': true    
    }
  }
};

export default nextConfig;