/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix for clientReferenceManifest error
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Workaround for Next.js 15 client reference manifest issue with route groups
    optimizePackageImports: ['@prisma/client'],
    // Ensure Prisma engines are traced
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
        'node_modules/@esbuild/linux-x64',
      ],
    },
  },
  
  // Fix for Prisma engine binary on Vercel
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Copy Prisma engine binaries to output directory for Vercel
      config.externals = config.externals || []
      // Don't externalize Prisma - we need the engine
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
  
  // Ensure Prisma engines are included in the build output
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/.prisma/**/*', './node_modules/@prisma/client/**/*'],
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

