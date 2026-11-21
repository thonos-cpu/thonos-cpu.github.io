import { expect, test } from '@playwright/test';

test('external links prevent reverse-tabnabbing', async ({ page }) => {
  await page.goto('/');
  const unsafe = await page.locator('a[target="_blank"]').evaluateAll((anchors) =>
    anchors
      .filter((anchor) => !anchor.rel.split(/\s+/).includes('noopener'))
      .map((anchor) => anchor.href),
  );
  expect(unsafe).toEqual([]);
});

test('production pages do not expose hidden configuration', async ({ page }) => {
  for (const route of ['/', '/playground']) {
    const response = await page.goto(route);
    const html = await response.text();
    expect(html).not.toMatch(/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/);
    expect(html).not.toMatch(/github_pat_[A-Za-z0-9_]{30,}/);
  }
});

test('untrusted HTML remains text in the assistant', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ask about Athanasios' }).click();
  await page.locator('[data-tg-input]').fill('<svg onload=alert(1)>');
  await page.locator('[data-tg-form]').evaluate((form) => form.requestSubmit());
  await expect(page.locator('.tg__msg--user svg')).toHaveCount(0);
  await expect(page.locator('.tg__msg--user').last()).toContainText('<svg onload=alert(1)>');
});

test('user code output cannot create DOM nodes in the host page', async ({ page }) => {
  await page.goto('/playground');
  await page.locator('[data-pg-code]').fill('console.log("<script>window.xss=1</script>")');
  await page.locator('[data-pg-run]').click();
  await expect(page.locator('[data-pg-out]')).toContainText('<script>window.xss=1</script>');
  expect(await page.evaluate(() => window.xss ?? null)).toBeNull();
});
