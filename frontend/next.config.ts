import type { NextConfig } from "next";

const apiUrl =
  process.env.NEXT_INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["frontend-e2e"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: "/sanctum/:path*",
        destination: `${apiUrl}/sanctum/:path*`,
      },
    ];
  },
};

export default nextConfig;
