import path from "node:path";
import { expect, test } from "@playwright/test";

test("authenticated analytics dashboard renders live and historical data", async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, "Requires a configured Supabase admin account.");
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Traffic & tool activity" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Encrypted tool records" })).toBeVisible();

  if (process.env.E2E_SCREENSHOT_DIR) {
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.screenshot({ path: path.join(process.env.E2E_SCREENSHOT_DIR, "tasis-admin-dashboard.png"), fullPage: true });
  }
});
