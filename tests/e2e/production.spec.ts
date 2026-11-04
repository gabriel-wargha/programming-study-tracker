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
