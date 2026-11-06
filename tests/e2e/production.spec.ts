import { expect, test } from "@playwright/test";

test("a production server ignores LOCAL_OWNER_MODE and fails closed", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Continue with GitHub" })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("Sign-in is not available yet.");
});

test("the home page also fails closed in production", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("the public portfolio route needs no login and hides unknown pages", async ({ page }) => {
  const response = await page.goto("/u/no-such-portfolio");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveURL(/\/u\/no-such-portfolio$/);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
});
