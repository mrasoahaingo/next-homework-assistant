import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: 5 * 1024 * 1024,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
