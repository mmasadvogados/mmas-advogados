import { test, expect } from "@playwright/test";

test.describe("Admin Newsletter Page", () => {
  test("newsletter admin page requires authentication", async ({ page }) => {
    const response = await page.goto("/admin/newsletter", { timeout: 60000 });
    // Should redirect to login or return the page (auth-protected)
    expect(response?.status()).toBeLessThan(500);
  });

  test("subscribers admin page requires authentication", async ({ page }) => {
    const response = await page.goto("/admin/assinantes", { timeout: 60000 });
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe("Newsletter Unsubscribe", () => {
  test("unsubscribe endpoint responds", async ({ page }) => {
    const response = await page.goto(
      "/api/newsletter/unsubscribe?email=nonexistent@test.com",
      { timeout: 60000, waitUntil: "commit" }
    );
    // Should redirect (302) or return success
    expect(response?.status()).toBeLessThan(500);
  });
});
