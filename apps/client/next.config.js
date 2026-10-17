//@ts-check

const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@work-hub/contracts', '@work-hub/constants'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Local MinIO (WH-047); production CDN host goes here too.
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
    ],
  },
  // Old verification emails and bookmarks used /{locale}/app (WH-045).
  async redirects() {
    return [
      {
        source: '/:locale/app',
        destination: '/:locale/dashboard',
        permanent: true,
      },
      {
        source: '/:locale/app/:path*',
        destination: '/:locale/dashboard/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
