/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*', // This proxies requests to your Spring Boot backend
      },
    ];
  },
};

export default nextConfig;

