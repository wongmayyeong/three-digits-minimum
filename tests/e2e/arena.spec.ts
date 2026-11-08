import { expect, test, type Page } from '@playwright/test';

const ADMIN = 'e2e-admin-token-0123456789abcdef';

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Download the React DevTools|favicon/.test(m.text())) errors.push(m.text()); });
  return errors;
}

async function noHorizontalScroll(page: Page) {
  await page.waitForLoadState('networkidle');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test('episode: admin-started debate -> verdict -> report -> replay from stored data', async ({ page, request }) => {
  const errors = trackErrors(page);
  const denied = await request.post('/api/debates', { data: {} });
  expect(denied.status()).toBe(403);
  const res = await request.post('/api/debates', { headers: { authorization: `Bearer ${ADMIN}` }, data: {} });
  expect(res.status()).toBe(202);
  const { url } = (await res.json()) as { url: string };
  await page.goto(url);
  await expect(page.getByText('SYNTHETIC TEST RUN')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Verdict', exact: true })).toBeVisible({ timeout: 200_000 });
  await expect(page.locator('#tr-h ~ ol > li')).toHaveCount(7);

  await page.getByRole('link', { name: 'Read the thesis report' }).click();
  await expect(page.getByRole('heading', { name: 'Evidence register' })).toBeVisible();

  await page.goto(url);
  const sideRequests: string[] = [];
  page.on('request', (r) => { if (/\/api\/debates(\/[^/]+\/retry)?$|\/api\/topics/.test(new URL(r.url()).pathname) && r.method() === 'POST') sideRequests.push(r.url()); });
  await page.getByRole('button', { name: 'Play replay' }).click();
  const stage = page.getByRole('region', { name: 'Debate stage' });
  await expect(stage.getByText('Evidence reveal')).toBeVisible();
  await page.getByRole('button', { name: 'Skip to next turn' }).click();
  await expect(stage.getByText('Round 1 · Opening')).toBeVisible();
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Skip to next turn' }).click();
  await expect(stage.getByText('Verdict', { exact: true })).toBeVisible();
  expect(sideRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('thesis page shows the question, three sub-questions and a computed verdict', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Is NEAR Building the Future or Following the Hype?' })).toBeVisible();
  for (const id of ['#pivots', '#lasted', '#adoption', '#pays', '#verdict']) await expect(page.locator(id)).toBeAttached();
  await expect(page.getByRole('heading', { name: /Did it last\?/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Did adoption justify the hype\?/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Does it pay \$NEAR\?/ })).toBeVisible();
  await expect(page.getByText('What would change this verdict')).toBeVisible();
  expect(errors).toEqual([]);
});

test('API validation and health without secrets', async ({ request }) => {
  expect((await request.get('/api/debates/not-an-id')).status()).toBe(404);
  const topics = await (await request.get('/api/topics')).json();
  expect(topics.topics).toHaveLength(1);
  const health = await request.get('/api/health');
  const text = await health.text();
  expect(text).not.toMatch(/sk-|nebube-local|postgresql:\/\/|e2e-admin-token/);
  expect(JSON.parse(text).checks.database).toBe('ok');
  expect((await request.get('/library', { maxRedirects: 0 })).status()).toBeGreaterThanOrEqual(300);
});

test('layout fits phones and the calculator recomputes @mobile', async ({ page }) => {
  const errors = trackErrors(page);
  for (const path of ['/', '/methodology', '/research']) {
    await page.goto(path);
    await noHorizontalScroll(page);
  }
  await page.goto('/methodology');
  const v = page.getByLabel('Buyback share (b)');
  await v.fill('50');
  await expect(page.getByLabel('Buyback share (b)')).toHaveValue('50');
  expect(errors).toEqual([]);
});

test('reduced motion disables ambient animation @mobile', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  const anim = await page.locator('.nb-star').first().evaluate((el) => getComputedStyle(el).animationName);
  expect(anim).toBe('none');
  await ctx.close();
});
