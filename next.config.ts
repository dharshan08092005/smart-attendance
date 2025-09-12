import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/dashboard/faculty_dashboard", destination: "/dashboard/faculty-dashboard" },
    ];
  },
};

export default nextConfig;
