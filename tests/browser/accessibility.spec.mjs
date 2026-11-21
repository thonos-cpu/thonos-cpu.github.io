import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const route of ['/', '/playground']) {
  test('automated accessibility audit: ' + route, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
    ).toEqual([]);
  });

  test('keyboard focus and landmark structure: ' + route, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('main#main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(route === '/' ? 1 : 0);
    await page.keyboard.press('Tab');
    const target = await page.evaluate(() => document.activeElement?.getAttribute('href'));
    expect(target).toBe('#main');
  });

  test('responsive focus and display: ' + route, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Toggle colour theme' })).toBeVisible();
  });
}
