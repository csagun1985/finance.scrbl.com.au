import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow server-side API calls to Anthropic
  serverExternalPackages: ['@anthropic-ai/sdk'],
};

export default nextConfig;
