/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server external packages for Next.js 15
  serverExternalPackages: ['socket.io'],
  
  // Enable real IP detection
  experimental: {
    // trustHost: true // Removed - not needed for IP detection
  },
  
  // Static file serving configuration
  async rewrites() {
    return [
      {
        source: '/manifest.json',
        destination: '/api/manifest'
      },
      {
        source: '/admin-manifest.json',
        destination: '/api/admin-manifest'
      },
      {
        source: '/favicon.ico',
        destination: '/api/favicon'
      },
      {
        source: '/favicon-16x16.png',
        destination: '/api/favicon-16x16'
      },
      {
        source: '/favicon-32x32.png',
        destination: '/api/favicon-32x32'
      },
      {
        source: '/icon-192.png',
        destination: '/api/icon-192'
      },
      {
        source: '/icon-512.png',
        destination: '/api/icon-512'
      },
      {
        source: '/admin-icon-192.png',
        destination: '/api/admin-icon-192'
      },
      {
        source: '/admin-icon-512.png',
        destination: '/api/admin-icon-512'
      }
    ]
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig 