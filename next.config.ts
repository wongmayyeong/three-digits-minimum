import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const config: NextConfig = {
  poweredByHeader: false,
  // Separate build directory for parallel E2E servers; defaults to .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  serverExternalPackages: ['@google-cloud/bigquery', 'pg', '@prisma/adapter-pg'],
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default config;
