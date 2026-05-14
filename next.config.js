/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite subir archivos hasta 10 MB en API Routes
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

module.exports = nextConfig;
