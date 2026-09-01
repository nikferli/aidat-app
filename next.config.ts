import type { NextConfig } from "next";

async headers() {
  return [{
    source: '/sw.js',
    headers: [{ key: 'Service-Worker-Allowed', value: '/' }]
  }]
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
