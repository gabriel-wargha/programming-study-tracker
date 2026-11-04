import { expect, test } from "@playwright/test";

test("the local owner opens an empty dashboard from the home page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No active goals yet" })).toBeVisible();
  await expect(page.getByText("Local owner · development only")).toBeVisible();

  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("the skip link moves keyboard focus to the main content", async ({ page }) => {
  await page.goto("/dashboard");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("a signed-in local owner is sent from the login page to the dashboard", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveURL(/\/dashboard$/);
});
