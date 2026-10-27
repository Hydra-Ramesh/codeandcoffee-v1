import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 2592000, // 30 days (prevents burning Vercel 1,000 free image transformation quota)
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5000',
      },
      {
        protocol: 'https',
        hostname: 'codeandcoffee-v1.onrender.com',
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  async headers() {
    const apiOrigin = process.env.NEXT_PUBLIC_API_URL
      ? (() => {
          try {
            return new URL(process.env.NEXT_PUBLIC_API_URL).origin;
          } catch {
            return 'https://codeandcoffee-v1.onrender.com';
          }
        })()
      : 'https://codeandcoffee-v1.onrender.com';

    const wsOrigin = apiOrigin ? apiOrigin.replace(/^http/, 'ws') : '';

    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' blob: data: http://localhost:5000 http://127.0.0.1:5000 http://localhost:* http://127.0.0.1:* ${apiOrigin} https://codeandcoffee-v1.onrender.com https://res.cloudinary.com https://images.unsplash.com https://api.dicebear.com https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://codeandcoffee.live https://www.codeandcoffee.live;
      font-src 'self' data: https://fonts.gstatic.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      connect-src 'self' http://localhost:5000 ws://localhost:5000 wss://localhost:5000 http://127.0.0.1:5000 ws://127.0.0.1:5000 ${apiOrigin} ${wsOrigin} https://codeandcoffee-v1.onrender.com wss://codeandcoffee-v1.onrender.com ws://codeandcoffee-v1.onrender.com https://*.onrender.com wss://*.onrender.com https://codeandcoffee.live wss://codeandcoffee.live https://www.codeandcoffee.live wss://www.codeandcoffee.live https://api.dicebear.com https://res.cloudinary.com;
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
