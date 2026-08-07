/** @type {import('next').NextConfig} */
const nextConfig = {
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
