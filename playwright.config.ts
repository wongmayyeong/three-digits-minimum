import { defineConfig, devices } from '@playwright/test';

const TEST_DB = process.env.TEST_DATABASE_URL ?? 'postgresql://nebube:nebube-local@localhost:54339/nebube_test';
const env = { DATABASE_URL: TEST_DB, NEBUBE_FIXTURE_LLM: '1', NEXT_DIST_DIR: '.next-e2e', RATE_LIMIT_DEBATES_PER_HOUR: '50', OPENAI_API_KEY: '', ELEVENLABS_API_KEY: '' };

/**
 * End-to-end tests run against a dev server and a worker on the test database, using the
 * local synthetic LLM fixture (no credentials) and live public data sources (network needed).
 */
export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:3100', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: [
    { command: 'npx prisma migrate deploy && npx next dev -p 3100', url: 'http://localhost:3100/api/topics', timeout: 180_000, reuseExistingServer: false, env },
    { command: 'npx tsx src/worker/index.ts', url: undefined as unknown as string, port: undefined, timeout: 60_000, env, reuseExistingServer: false, wait: { stdout: /worker_started/ } } as never,
  ],
});
