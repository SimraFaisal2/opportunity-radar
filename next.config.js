/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep Prisma's client + query engine out of the serverless bundle — avoids
  // "Critical dependency" build warnings and duplicated-engine bloat on Vercel.
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

module.exports = nextConfig;
