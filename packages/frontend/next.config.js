/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@xpr-quests/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
