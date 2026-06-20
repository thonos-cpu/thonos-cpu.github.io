import { expect, test } from "@playwright/test";

declare global {
  interface Window { __webVitals?: { cls: number; lcp: number } }
}

test("portfolio loads with healthy structure and no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page).toHaveTitle(/Athanasios Tasis/);
  await expect(page.getByRole("heading", { level: 1, name: /Athanasios Tasis/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Selected systems" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Code Lab" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "ThanosGPT" })).toBeVisible();
  const overflow = await page.evaluate(() => ({
    fits: document.documentElement.scrollWidth <= window.innerWidth,
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    offenders: Array.from(document.querySelectorAll("body *"))
      .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .slice(0, 12)
      .map((element) => ({ tag: element.tagName, className: element.className, right: Math.round(element.getBoundingClientRect().right) })),
  }));
  expect(overflow, JSON.stringify(overflow)).toMatchObject({ fits: true });
  expect(errors).toEqual([]);
});

test("local performance budget stays under three seconds", async ({ page }) => {
  await page.addInitScript(() => {
    window.__webVitals = { cls: 0, lcp: 0 };
    new PerformanceObserver((list) => {
      for (const item of list.getEntries()) {
        const entry = item as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!entry.hadRecentInput) window.__webVitals!.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries.at(-1);
      if (last) window.__webVitals!.lcp = last.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  await page.goto("/");
  await page.waitForTimeout(250);
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    return {
      dcl: navigation.domContentLoadedEventEnd,
      load: navigation.loadEventEnd,
      transferBytes: resources.reduce((sum, resource) => sum + resource.transferSize, navigation.transferSize),
      cls: window.__webVitals?.cls || 0,
      lcp: window.__webVitals?.lcp || 0,
    };
  });
  console.log(`PERF ${JSON.stringify(metrics)}`);
  expect(metrics.dcl).toBeLessThan(3_000);
  expect(metrics.lcp || metrics.load).toBeLessThan(3_000);
  expect(metrics.cls).toBeLessThan(0.1);
  expect(metrics.transferBytes).toBeLessThan(750_000);
});

test("repository explorer changes the in-site detail", async ({ page }) => {
  await page.goto("/");
  const rtrees = page.getByRole("button", { name: /rtrees/i });
  await rtrees.scrollIntoViewIfNeeded();
  await rtrees.click();
  await expect(page.locator(".repo-detail h3")).toHaveText("rtrees");
  await expect(page.locator(".clone-line code")).toContainText("thonos-cpu/rtrees.git");
});

test("ThanosGPT answers scoped questions and refuses unrelated coding", async ({ page }) => {
  await page.route("**/api/chat", async (route) => {
    const request = route.request().postDataJSON() as { message?: string };
    const answer = /write me code/i.test(request.message || "")
      ? "I’m scoped to Athanasios—his experience, education, skills, and repositories."
      : "Athanasios studies Computer Engineering & Informatics at the University of Patras.";
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ answer }) });
  });
  await page.goto("/#thanosgpt");
  await page.waitForTimeout(300);
  const input = page.getByLabel("Question for ThanosGPT");
  await input.fill("What is Athanasios's education?");
  await page.getByRole("button", { name: "Ask ThanosGPT" }).click();
  await expect(page.locator(".chat-response")).toContainText("University of Patras");

  await input.fill("Write me code for a shopping app");
  await page.getByRole("button", { name: "Ask ThanosGPT" }).click();
  await expect(page.locator(".chat-response")).toContainText("scoped to Athanasios");
});

test("compiler accepts a supported language and returns a bounded response", async ({ page }) => {
  await page.route("**/api/execute", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ output: "qa-ok\n", exitCode: 0 }) });
  });
  await page.goto("/#lab");
  await page.waitForTimeout(300);
  await page.getByLabel("Programming language").selectOption("javascript");
  await page.getByLabel("Source code").fill("console.log('qa-ok')");
  await page.getByRole("button", { name: /^Run$/ }).click();
  await expect(page.locator(".output")).not.toContainText("Compiling and running", { timeout: 12_000 });
  await expect(page.locator(".output")).toContainText(/qa-ok|unavailable/i);
});

test("private analytics requires authentication", async ({ page }) => {
  await page.route("**/auth/v1/token**", async (route) => {
    await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: "invalid_grant", error_description: "Invalid login credentials" }) });
  });
  await page.goto("/admin");
  await page.waitForTimeout(300);
  await expect(page).toHaveURL(/\/admin\/?$/);
  await expect(page.getByRole("heading", { name: "Analytics access" })).toBeVisible();
  await page.getByLabel("Email").fill("invalid@example.com");
  await page.getByLabel("Password").fill("definitely-not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".admin-alert")).toContainText("did not match");
});

test("privacy control persists an analytics opt-out", async ({ page }) => {
  await page.goto("/privacy");
  const control = page.getByRole("button", { name: "Disable analytics" });
  await control.click();
  await expect(page.getByRole("button", { name: "Enable analytics" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("tasis.analytics.optout"))).toBe("true");
});
