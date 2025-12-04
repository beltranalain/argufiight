/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix for clientReferenceManifest error
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Workaround for Next.js 15 client reference manifest issue with route groups
    optimizePackageImports: ['@prisma/client'],
  },
  
  // Workaround for Vercel build tracing issue with route groups
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ignore missing client reference manifest files during build
      config.resolve.fallback = {
        ...config.resolve.fallback,
      }
    }
    return config
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Enable compression
  compress: true,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}

export default nextConfig

