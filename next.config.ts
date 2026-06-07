import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'png.pngtree.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn3d.iconscout.com',
      },
    ],
  },
};

export default nextConfig;
// Force configuration reload to clear middleware cache
