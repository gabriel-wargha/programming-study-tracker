import { expect, test } from "@playwright/test";

test("the owner manages a topic and a goal from creation to archive", async ({ page }, info) => {
  const suffix = `${info.project.name}-${Date.now()}`;
  const topicName = `TypeScript ${suffix}`;
  const goalTitle = `Typed forms ${suffix}`;

  // Settings: make room for an active goal.
  await page.goto("/settings");
  await page.getByLabel("Maximum active goals").fill("10");
  await page.getByRole("button", { name: "Save limit" }).click();
  await expect(page.getByRole("status").first()).toHaveText("Active goal limit saved.");

  // Topics: validation, creation, and duplicate names.
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Topics" }).click();
  await page.getByRole("button", { name: "Create topic" }).click();
  await expect(page.getByLabel("Topic name")).toHaveAccessibleDescription("Enter a topic name.");

  await page.getByLabel("Topic name").fill(topicName);
  await page.getByLabel("Description (optional)").fill("Types for safer refactors.");
  await page.getByRole("button", { name: "Create topic" }).click();
  await expect(page.getByRole("heading", { level: 1, name: topicName })).toBeVisible();

  await page.goto("/topics");
  await page.getByLabel("Topic name").fill(topicName.toUpperCase());
  await page.getByRole("button", { name: "Create topic" }).click();
  await expect(page.getByLabel("Topic name")).toHaveAccessibleDescription("You already have a topic with this name.");
  await page.getByRole("link", { name: topicName, exact: true }).click();

  // Goals: create an active goal under the topic.
  await page.getByRole("link", { name: "Add a goal to this topic" }).click();
  await expect(page).toHaveURL(/\/goals\/new\?topic=/);
  await expect(page.getByLabel("Topic", { exact: true })).toHaveValue(/.+/);
  // A failed validation keeps the chosen topic, in the browser as well as in state.
  await page.getByRole("button", { name: "Create goal" }).click();
  await expect(page.getByLabel("Goal title")).toHaveAccessibleDescription("Enter a goal title.");
  await expect(page.getByLabel("Topic", { exact: true })).toHaveValue(/.+/);
  await page.getByLabel("Goal title").fill(goalTitle);
  await page.getByLabel("Definition of done").fill("A form whose fields are inferred from a schema.");
  await page.getByLabel("Starting status").selectOption("active");
  await page.getByRole("button", { name: "Create goal" }).click();
  await expect(page.getByRole("heading", { level: 1, name: goalTitle })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Definition of done" })).toBeVisible();

  // A topic with an active goal cannot be archived.
  await page.getByRole("link", { name: topicName, exact: true }).click();
  await expect(page.getByRole("button", { name: "Archive topic" })).toBeDisabled();
  await page.getByRole("region", { name: "Archive topic" }).getByRole("link", { name: goalTitle }).click();

  // Status: completing needs confirmation.
  await page.getByLabel("Move goal to").selectOption("completed");
  await page.getByRole("button", { name: "Complete goal" }).click();
  await expect(page.getByText("Confirm that you've met the definition of done.")).toBeVisible();
  await page.getByRole("checkbox", { name: "I've met the definition of done." }).check();
  await page.getByRole("button", { name: "Complete goal" }).click();
  await expect(page.getByRole("form", { name: "Change goal status" }).getByRole("status")).toHaveText("Goal status updated.");
  await expect(page.getByRole("article").getByText("Completed", { exact: true })).toBeVisible();

  // Editing keeps the goal on its page.
  await page.getByText("Edit goal", { exact: true }).click();
  await page.getByLabel("Goal title").fill(`${goalTitle} (edited)`);
  await page.getByRole("button", { name: "Save goal" }).click();
  await expect(page.getByRole("form", { name: "Edit goal" }).getByRole("status")).toHaveText("Goal saved.");
  await expect(page.getByRole("heading", { level: 1, name: `${goalTitle} (edited)` })).toBeVisible();

  // The goal list filters by status.
  await page.goto("/goals?status=completed");
  await expect(page.getByRole("link", { name: /^Completed/ })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: `${goalTitle} (edited)` })).toBeVisible();

  // Archive the topic now that it has no active goals.
  await page.goto("/topics");
  await page.getByRole("link", { name: topicName, exact: true }).click();
  await page.getByRole("button", { name: "Archive topic" }).click();
  await expect(page.getByRole("article").getByText("Archived", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Add a goal to this topic" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("unknown and malformed IDs show a not found page", async ({ page }) => {
  for (const path of ["/topics/not-a-uuid", "/goals/00000000-0000-4000-8000-000000000000"]) {
    await page.goto(path);
    // Pages stream behind a loading screen, so not-found arrives as a page rather than a 404 status.
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  }
});
