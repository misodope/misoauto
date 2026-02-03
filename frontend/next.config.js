const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: {
    // Disable ESLint during builds (can still run manually)
    ignoreDuringBuilds: true,
  },
  turbopack: {
    // Set root to monorepo root for Docker builds where node_modules is at parent level
    root: path.resolve(__dirname, '..'),
  },
  async rewrites() {
    return [
      {
        source: '/home',
        destination: '/pages/home',
      },
      {
        source: '/auth',
        destination: '/pages/auth',
      },
      {
        source: '/auth/login',
        destination: '/pages/auth/login',
      },
      {
        source: '/auth/register',
        destination: '/pages/auth/register',
      },
      {
        source: '/integrations',
        destination: '/pages/integrations',
      },
      {
        source: '/videos',
        destination: '/pages/videos',
      },
      {
        source: '/videos/scheduled',
        destination: '/pages/videos/scheduled',
      },
      {
        source: '/legal',
        destination: '/pages/legal',
      },
      {
        source: '/legal/terms',
        destination: '/pages/legal/terms',
      },
      {
        source: '/legal/privacy',
        destination: '/pages/legal/privacy',
      },
    ];
  },
};

module.exports = nextConfig;
