import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/pm'],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.css$/i,
      use: ['style-loader', 'css-loader'],
    });
    return config;
  },
  images: {
    domains: [
      'localhost', 
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || '',
      'weddingtheory.blr1.digitaloceanspaces.com',
      'images.unsplash.com'
    ],
  }
};

export default nextConfig;
