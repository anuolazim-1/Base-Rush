/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize for both desktop and mobile
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig