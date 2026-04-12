import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: process.env.DEPLOY_TARGET === 'docker' ? 'standalone' : undefined,
};

export default nextConfig;
