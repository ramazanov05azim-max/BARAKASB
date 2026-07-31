import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: [
    '@barakasb/contracts-platform',
    '@barakasb/frontend-extension-host',
    '@barakasb/solution-coffee',
  ],
};

export default nextConfig;
