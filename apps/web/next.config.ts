import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: process.env.DEPLOY_TARGET === 'docker' ? 'standalone' : undefined,
};

export default withNextIntl(nextConfig);
