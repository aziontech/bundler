/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    runtime: 'experimental-edge',
  },
  reactStrictMode: true,
  i18n: {
    locales: ['en', 'fr', 'ar'],
    defaultLocale: 'en',
    domains: [
      {
        domain: 'example.es',
        defaultLocale: 'es',
      },
    ],
  },
}

module.exports = nextConfig
