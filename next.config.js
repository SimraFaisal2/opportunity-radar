/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep Prisma's client + query engine out of the serverless bundle — avoids
  // "Critical dependency" build warnings and duplicated-engine bloat on Vercel.
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  // Send the bare domain to the opportunity board. Routing-level redirects
  // always emit a real Location header (a server-component redirect() in a
  // statically-prerendered page does not, which broke direct navigation).
  async redirects() {
    return [{ source: "/", destination: "/board", permanent: false }];
  },
};

module.exports = nextConfig;
