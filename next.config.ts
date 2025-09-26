// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // ✅ Allow Cloudinary images
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ Skip ESLint during production build
  },
  reactStrictMode: true,       // ✅ Helps catch potential issues early
  output: "standalone",        // ✅ Enables optimized build for Docker
};

export default nextConfig;
