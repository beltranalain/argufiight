/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strip console.log in production (keep console.error)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },

  // Fix for clientReferenceManifest error
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Workaround for Next.js 15 client reference manifest issue with route groups
    optimizePackageImports: [
      '@prisma/client',
      'recharts',
      'framer-motion',
      'firebase',
      '@tiptap/react',
      '@tiptap/starter-kit',
    ],
  },
  
  // Ensure Prisma engines are traced (moved from experimental)
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/linux-x64',
    ],
  },
  
  // Fix for Prisma engine binary on Vercel
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't externalize Prisma - we need it bundled with the engine
      config.externals = config.externals || []
      config.externals = config.externals.filter(
        (external) => typeof external !== 'string' || !external.includes('@prisma')
      )
    } else {
      // Client-side: ignore missing client reference manifest files during build
      config.resolve.fallback = {
        ...config.resolve.fallback,
      }
    }
    return config
  },
  
  // Ensure Prisma engines are included in the build output for ALL routes
  // This is critical - the root page uses Prisma to check sessions
  // Use wildcard to include all Prisma files
  outputFileTracingIncludes: {
    '*': [
      './node_modules/.prisma/**/*',
      './node_modules/@prisma/**/*',
    ],
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
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'dvwkcztlq7v3f9uk.public.blob.vercel-storage.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    unoptimized: false,
  },
  
  // Enable compression
  compress: true,
  
  // Security and performance headers
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
            value: 'camera=(self), microphone=(self), geolocation=()'
          }
        ]
      },
      // Static assets caching
      {
        source: '/:path*\\.(jpg|jpeg|png|gif|ico|svg|webp|avif|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}

export default nextConfig

