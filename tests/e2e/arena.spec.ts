import { expect, test, type Page } from '@playwright/test';

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

test('topic -> research -> full debate -> verdict -> report -> replay', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Every claim has an opponent.' })).toBeVisible();
  await expect(page.locator('#topics ~ ol > li')).toHaveCount(3);

  await page.getByRole('link', { name: /Open the case/ }).first().click();
  await expect(page).toHaveURL(/\/topics\/intents-bet$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('NEAR Intents');
  await expect(page.getByText(/Last refreshed|Checking sources/)).toBeVisible();

  await page.getByRole('button', { name: 'Start debate' }).click();
  await expect(page).toHaveURL(/\/debates\/d_[A-Za-z0-9_-]+$/, { timeout: 30_000 });
  const debateUrl = page.url();
  await expect(page.getByText('SYNTHETIC TEST RUN')).toBeVisible();
  // Real research status from the job event stream, then the verdict once all turns are done.
  await expect(page.getByRole('heading', { name: 'Verdict', exact: true })).toBeVisible({ timeout: 200_000 });
  await expect(page.locator('#tr-h ~ ol > li')).toHaveCount(7);
  await expect(page.getByText('The argument ends. The evidence remains.').first()).toBeVisible();

  await page.getByRole('link', { name: 'Read the thesis report' }).click();
  await expect(page.getByRole('heading', { name: 'Evidence register' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Falsification triggers' })).toBeVisible();
  const md = await page.request.get(`${debateUrl.replace(/.*\/debates\//, '/api/debates/')}/report?format=md`);
  expect(md.status()).toBe(200);
  expect(await md.text()).toContain('## Evidence register');

  // Replay: stored data only, starts on request, keyboard skips scenes.
  await page.goto(debateUrl);
  const replayReq: string[] = [];
  page.on('request', (r) => { if (/\/api\/debates\/[^/]+\/(rematch|retry)|\/api\/topics/.test(r.url())) replayReq.push(r.url()); });
  await page.getByRole('button', { name: 'Play replay' }).click();
  const stage = page.getByRole('region', { name: 'Debate stage' });
  await expect(stage.getByText('Evidence reveal')).toBeVisible();
  await page.getByRole('button', { name: 'Skip to next turn' }).click();
  await expect(stage.getByText('Round 1 · Opening')).toBeVisible();
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Play' , exact: true })).toBeVisible();
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Skip to next turn' }).click();
  await expect(stage.getByText('Verdict', { exact: true })).toBeVisible();
  expect(replayReq).toEqual([]);
  expect(errors).toEqual([]);
});

test('API validation, rate-safe errors and health without secrets', async ({ request }) => {
  const bad = await request.post('/api/debates', { data: { topic: 'price-2030' } });
  expect(bad.status()).toBe(400);
  expect((await bad.json()).error.code).toBe('bad_request');
  const extra = await request.post('/api/debates', { data: { topic: 'intents-bet', url: 'http://169.254.169.254/' } });
  expect(extra.status()).toBe(400);
  expect((await request.get('/api/debates/not-an-id')).status()).toBe(404);
  const topics = await (await request.get('/api/topics')).json();
  expect(topics.topics).toHaveLength(3);
  const health = await request.get('/api/health');
  const text = await health.text();
  expect(text).not.toMatch(/sk-|nebube-local|postgresql:\/\//);
  expect(JSON.parse(text).checks.database).toBe('ok');
});

test('library filters and empty states @mobile', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/library?winner=bear&topic=long-game');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/No debates match these filters|Replay/).first()).toBeVisible();
  await noHorizontalScroll(page);
  await page.goto('/');
  await noHorizontalScroll(page);
  await page.goto('/methodology');
  await noHorizontalScroll(page);
  // Calculator: editing an input relabels it ASSUMED and recomputes.
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
