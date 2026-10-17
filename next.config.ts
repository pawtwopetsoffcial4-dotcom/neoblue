import { execSync } from "child_process";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

function resolveGitCommit(): string {
  // Prefer whatever the host's build system already knows (set automatically,
  // no dashboard config needed) before falling back to reading git directly.
  const hostProvided =
    process.env.RENDER_GIT_COMMIT ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.COMMIT_REF ||
    process.env.RAILWAY_GIT_COMMIT_SHA;
  if (hostProvided) return hostProvided;

  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

const gitCommit = resolveGitCommit();
const buildTime = new Date().toISOString();

const nextConfig: NextConfig = {
  env: {
    APP_GIT_COMMIT: gitCommit,
    APP_BUILD_TIME: buildTime,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'png.pngtree.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn3d.iconscout.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.stockcake.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-App-Commit', value: gitCommit },
          { key: 'X-App-Build-Time', value: buildTime },
        ],
      },
      {
        source: '/:all*(svg|jpg|png|webp|gif|ico|woff|woff2|ttf|css|js)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "neoblue",
  project: "nextjs",
  widenClientFileUpload: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
