import path from "node:path";
import { expect, test } from "@playwright/test";

test("authenticated analytics dashboard renders live and historical data", async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_PASSWORD, "Requires local demo dashboard credentials.");
  await page.goto("/admin/login");
  await page.getByLabel("Username").fill(process.env.E2E_ADMIN_USERNAME || "athanasios");
  await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Traffic & tool activity" })).toBeVisible();
  await expect(page.getByText("3 live now")).toBeVisible();
  await expect(page.getByText(/1[,.]634/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Encrypted tool records" })).toBeVisible();
  await page.locator(".admin-log").first().click();
  await expect(page.locator(".admin-log pre").first()).toContainText("Athanasios");

  if (process.env.E2E_SCREENSHOT_DIR) {
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.screenshot({ path: path.join(process.env.E2E_SCREENSHOT_DIR, "tasis-admin-dashboard.png"), fullPage: true });
  }
});
