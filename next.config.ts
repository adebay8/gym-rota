import type { NextConfig } from 'next';

// Deployed on Vercel. Pages are still pre-rendered at build time; only /api/progress runs on the server.
const nextConfig: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
