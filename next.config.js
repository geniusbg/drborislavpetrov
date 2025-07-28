/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable HTTPS in development for iOS compatibility
  experimental: {
    https: true
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig 