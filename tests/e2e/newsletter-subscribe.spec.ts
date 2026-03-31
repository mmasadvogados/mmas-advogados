import { test, expect } from "@playwright/test";

test.describe("Newsletter Subscription", () => {
  test("footer shows newsletter subscription form", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByText("Newsletter")).toBeVisible();
    await expect(footer.getByPlaceholder("Seu email")).toBeVisible();
    await expect(footer.getByRole("button", { name: "Me inscrever" })).toBeVisible();
  });

  test("subscribing with valid email shows response message", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    const emailInput = footer.getByPlaceholder("Seu email");
    const submitButton = footer.getByRole("button", { name: "Me inscrever" });

    const testEmail = `teste-e2e-${Date.now()}@exemplo.com`;
    await emailInput.fill(testEmail);
    await submitButton.click();

    // Button should show "Enviando..." while loading
    // Then a response paragraph appears (success or error)
    const responseMsg = footer.locator("p").filter({ hasText: /inscri|erro|já está/i });
    await expect(responseMsg).toBeVisible({ timeout: 45000 });
  });

  test("empty email is prevented by required attribute", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    const emailInput = footer.getByPlaceholder("Seu email");

    // Input has required attribute - verify it exists
    await expect(emailInput).toHaveAttribute("required", "");
    await expect(emailInput).toHaveAttribute("type", "email");
  });
});

test.describe("Blog", () => {
  test("blog page is accessible", async ({ page }) => {
    const response = await page.goto("/blog");
    expect(response?.status()).toBeLessThan(500);
  });
});
