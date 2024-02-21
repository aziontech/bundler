/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [
        // These rewrites are checked after headers/redirects
        // and before all files including _next/public files which
        // allows overriding page files
        {
          source: "/run-rewrite-before",
          destination: "/rewrite-before-page",
          has: [{ type: "query", key: "overrideMe" }],
        },
      ],
      afterFiles: [
        // These rewrites are checked after pages/public files
        // are checked but before dynamic routes
        {
          source: "/run-rewrite-after",
          destination: "/rewrite-after-page",
        },
      ],
    };
  },
  async redirects() {
    return [
      {
        source: "/run-redirect-permanent",
        destination: "/redirect-permanent-page",
        permanent: true,
      },
      {
        source: "/run-simple-redirect",
        destination: "/redirect-page",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/", // applies to `/` route
        headers: [
          {
            key: "x-hello",
            value: "world",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
