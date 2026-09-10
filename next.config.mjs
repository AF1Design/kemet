/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gamcgqbilnbjabxrvgcu.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/media/products/:path*',
        destination: 'https://gamcgqbilnbjabxrvgcu.supabase.co/storage/v1/object/public/products/:path*',
      },
    ];
  },
};

export default nextConfig;
