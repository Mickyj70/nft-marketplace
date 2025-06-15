/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "placehold.co",
      "via.placeholder.com",
      "ik.imagekit.io",
      "picsum.photos",
    ],
  },
  
  // Enhanced mobile support
  experimental: {
    esmExternals: 'loose',
  },
  
  // Ensure proper mobile wallet deep linking
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
