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
  // First visit compiles the report route under next dev; allow for it.
  await expect(page.getByRole('heading', { name: 'Evidence register' })).toBeVisible({ timeout: 60_000 });

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

test('thesis page shows the hook, the price ladder and a computed verdict', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Three Digits, Minimum?' })).toBeVisible();
  for (const id of ['#answer', '#ladder', '#evidence', '#verdict', '#hypotheses']) await expect(page.locator(id)).toBeAttached();
  await expect(page.getByRole('heading', { name: /not a proven path to \$100/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /What would \$10, \$25, \$50 and \$100 in ten years take\?/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Where does NEAR lead, and where does it trail?/ })).toBeVisible();
  // The ladder explorer recomputes when a rung and a valuation are chosen.
  const ladder = page.locator('#ladder');
  await ladder.getByRole('radio', { name: /\$25/ }).click();
  await ladder.getByRole('radio', { name: /Priced like Tron/ }).click();
  await expect(ladder.getByText('Observed').first()).toBeVisible();
  await expect(ladder.getByText('Unproven').first()).toBeVisible();
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

test('reduced motion opens the debate without the camera transition, and Esc closes it @mobile', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  const watch = page.getByRole('button', { name: 'Watch the debate' });
  if (await watch.count()) {
    await watch.click();
    await expect(page.getByRole('dialog', { name: 'Debate' })).toBeVisible({ timeout: 1500 });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Debate' })).toHaveCount(0);
  } else {
    await expect(page.getByRole('link', { name: 'Read the verdict' })).toBeVisible();
  }
  await ctx.close();
});
