import next from 'eslint-config-next';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...next,
  ...nextTs,
  { ignores: ['.next/**', '.next-e2e/**', 'node_modules/**', 'src/generated/**', 'artifacts/**', '.data/**', 'playwright-report/**', 'test-results/**'] },
];

export default config;
