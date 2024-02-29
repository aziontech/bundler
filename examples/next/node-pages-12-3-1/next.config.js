/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    runtime: 'nodejs',
  },
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
