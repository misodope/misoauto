const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
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