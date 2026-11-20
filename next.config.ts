import type { NextConfig } from 'next';

// A fully static site: `next build` writes plain HTML, CSS and JS to `out/` for Cloudflare Pages.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
