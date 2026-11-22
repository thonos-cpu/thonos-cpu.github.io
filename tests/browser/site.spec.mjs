import { expect, test } from '@playwright/test';

test('homepage loads and exposes primary sections', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Athanasios');
  for (const id of ['work', 'about', 'path', 'contact']) {
    await expect(page.locator('#' + id)).toHaveCount(1);
  }
  await expect(page.locator('nav[aria-label="Primary"]')).toHaveCount(1);
});

test('navigation reaches the playground and back', async ({ page }) => {
  await page.goto('/');
  await page.goto('/playground');
  await expect(page.locator('[data-pg-code]')).toBeVisible();
  await page.locator('a.nav__brand').click();
  await expect(page).toHaveURL(/\/#top$/);
});

test('theme persists across navigation and reload', async ({ page }) => {
  await page.goto('/');
  const theme = await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button', { name: 'Toggle colour theme' }).click();
  const next = await page.locator('html').getAttribute('data-theme');
  expect(next).not.toBe(theme);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', next);
  await page.goto('/playground');
  await expect(page.locator('html')).toHaveAttribute('data-theme', next);
});

test('profile assistant answers and keeps hostile HTML inert', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ask about Athanasios' }).click();
  const box = page.locator('[data-tg]');
  await expect(box).toBeVisible();
  const payload = '<img src=x onerror="window.__injected = true">';
  await page.locator('[data-tg-input]').fill(payload);
  await page.locator('[data-tg-form]').evaluate((form) => form.requestSubmit());
  await expect(box.locator('.tg__msg--user').last()).toContainText(payload);
  await expect(box.locator('.tg__msg--user img')).toHaveCount(0);
  expect(await page.evaluate(() => window.__injected ?? false)).toBe(false);
  await page.keyboard.press('Escape');
  await expect(box).toBeHidden();
});

test('wheel over assistant scrolls conversation rather than the webpage', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ask about Athanasios' }).click();
  const log = page.locator('[data-tg-log]');
  await log.evaluate((element) => {
    for (let i = 0; i < 30; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'tg__msg tg__msg--bot';
      bubble.textContent = 'Conversation message ' + i;
      element.appendChild(bubble);
    }
    element.scrollTop = 0;
  });
  const pageBefore = await page.evaluate(() => window.scrollY);
  await page.locator('.tg__head').hover();
  await page.mouse.wheel(0, 400);
  await expect.poll(() => log.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(pageBefore);
});

test('assistant auto-scrolls to latest reply and restores page scroll on close', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ask about Athanasios' }).click();
  const log = page.locator('[data-tg-log]');
  const input = page.locator('[data-tg-input]');
  for (let i = 0; i < 12; i++) {
    await input.fill(i % 2 === 0 ? 'What projects has he built?' : 'Tell me more');
    await input.press('Enter');
    await expect(log.locator('.tg__msg--bot')).toHaveCount(i + 2);
  }
  await expect
    .poll(() =>
      log.evaluate((element) => element.scrollHeight - element.scrollTop - element.clientHeight),
    )
    .toBeLessThanOrEqual(2);
  const pageBefore = await page.evaluate(() => window.scrollY);
  await log.hover();
  await page.mouse.wheel(0, -450);
  await expect.poll(() => log.evaluate((element) => element.scrollTop)).toBeGreaterThanOrEqual(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(pageBefore);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-tg]')).toBeHidden();
  await page.mouse.move(30, 300);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(pageBefore);
});

test('playground executes JavaScript and keeps output as plain text', async ({ page }) => {
  await page.goto('/playground');
  await page.locator('[data-pg-lang]').selectOption('javascript');
  await page.locator('[data-pg-code]').fill('console.log("<img src=x onerror=alert(1)>")');
  await page.locator('[data-pg-run]').click();
  await expect(page.locator('[data-pg-out]')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('[data-pg-out] img')).toHaveCount(0);
});

test('playground reports syntax errors and recovers', async ({ page }) => {
  await page.goto('/playground');
  await page.locator('[data-pg-code]').fill('const = ;');
  await page.locator('[data-pg-run]').click();
  await expect(page.locator('[data-pg-out]')).toHaveClass(/pg__out--error/);
  await page.locator('[data-pg-code]').fill('console.log("recovered")');
  await page.locator('[data-pg-run]').click();
  await expect(page.locator('[data-pg-out]')).toContainText('recovered');
  await expect(page.locator('[data-pg-run]')).toBeEnabled();
});

test('playground stops infinite loops and remains usable', async ({ page }) => {
  test.setTimeout(40000);
  await page.goto('/playground');
  await page.locator('[data-pg-code]').fill('while (true) {}');
  await page.locator('[data-pg-run]').click();
  await expect(page.locator('[data-pg-out]')).toContainText('Timed out', { timeout: 12000 });
  await page.locator('[data-pg-code]').fill('console.log("alive")');
  await page.locator('[data-pg-run]').click();
  await expect(page.locator('[data-pg-out]')).toContainText('alive');
});

test('playground clears output and switches language snippets', async ({ page }) => {
  await page.goto('/playground');
  await page.locator('[data-pg-code]').fill('console.log("done")');
  await page.locator('[data-pg-run]').click();
  await expect(page.locator('[data-pg-out]')).toContainText('done');
  await page.locator('[data-pg-clear]').click();
  await expect(page.locator('[data-pg-out]')).toBeEmpty();
  await page.reload();
  await page.locator('[data-pg-lang]').selectOption('sql');
  await expect(page.locator('[data-pg-code]')).toHaveValue(/CREATE TABLE/);
});

test('site has no horizontal overflow at supported viewport widths', async ({ page }) => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, 'Horizontal overflow at ' + width + 'px').toBeLessThanOrEqual(2);
  }
});

test('no failed same-origin document requests', async ({ page }) => {
  const failures = [];
  page.on('response', (response) => {
    if (response.url().startsWith('http://127.0.0.1:4321/') && response.status() >= 400) {
      failures.push(response.url() + ': ' + response.status());
    }
  });
  await page.goto('/');
  await page.goto('/playground');
  expect(failures).toEqual([]);
});

test('all internal navigation URLs remain on this origin', async ({ page }) => {
  await page.goto('/');
  const anchors = await page
    .locator('a[href]')
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('href')).filter((href) => href?.startsWith('/')),
    );
  for (const href of anchors) {
    expect(new URL(href, page.url()).origin).toBe(new URL(page.url()).origin);
  }
});
