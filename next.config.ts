import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/pm'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'weddingtheory.blr1.digitaloceanspaces.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  typescript: {
    // Disable TypeScript during production builds
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
