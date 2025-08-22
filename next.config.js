/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server external packages for Next.js 15
  serverExternalPackages: ['socket.io'],
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