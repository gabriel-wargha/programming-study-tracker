import { expect, test, type Page } from "@playwright/test";

/** Structural checks in the page itself. Returns a list of problems. */
function auditPage(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    const visible = (el: Element) => el.getClientRects().length > 0;
    const name = (el: Element) => {
      const labelledBy = el.getAttribute("aria-labelledby");
      const byId = labelledBy && labelledBy.split(" ").map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
      const labels = (el as HTMLInputElement).labels ? [...(el as HTMLInputElement).labels!].map((label) => label.textContent).join(" ") : "";
      return (el.getAttribute("aria-label") || byId || labels || el.textContent || el.getAttribute("title") || "").trim();
    };

    if (!document.documentElement.lang) problems.push("html has no lang");
    if (!document.title.trim()) problems.push("page has no title");
    if (document.querySelectorAll("main").length !== 1) problems.push("page needs exactly one main landmark");

    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(visible);
    const h1s = headings.filter((heading) => heading.tagName === "H1");
    if (h1s.length !== 1) problems.push(`expected one h1, found ${h1s.length}`);
    let previous = 0;
    for (const heading of headings) {
      const level = Number(heading.tagName[1]);
      if (previous && level > previous + 1) problems.push(`heading level skips from h${previous} to h${level}: "${heading.textContent}"`);
      previous = level;
    }

    for (const control of document.querySelectorAll("input:not([type=hidden]),select,textarea")) {
      if (visible(control) && !name(control)) problems.push(`form control has no name: ${control.outerHTML.slice(0, 120)}`);
    }
    for (const control of document.querySelectorAll("button,a[href],summary")) {
      if (visible(control) && !name(control)) problems.push(`control has no name: ${control.outerHTML.slice(0, 120)}`);
    }
    for (const image of document.querySelectorAll("img:not([alt])")) problems.push(`image has no alt: ${image.outerHTML.slice(0, 120)}`);

    const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
    for (const id of new Set(ids.filter((value, index) => ids.indexOf(value) !== index))) problems.push(`duplicate id: ${id}`);
    for (const el of document.querySelectorAll("[aria-describedby],[aria-labelledby]")) {
      for (const attribute of ["aria-describedby", "aria-labelledby"]) {
        for (const id of (el.getAttribute(attribute) ?? "").split(" ").filter(Boolean)) {
          if (!document.getElementById(id)) problems.push(`${attribute} points to a missing id: ${id}`);
        }
      }
    }
    if (document.documentElement.scrollWidth > window.innerWidth) problems.push("page scrolls sideways");

    // Targets a finger or pointer needs, per WCAG 2.5.8 (24px), skipping inline text links.
    for (const control of document.querySelectorAll("button,summary,select,input:not([type=hidden])")) {
      // A checkbox or radio's label is part of its target.
      if (["checkbox", "radio"].includes(control.getAttribute("type") ?? "") && (control as HTMLInputElement).labels?.length) continue;
      const box = control.getBoundingClientRect();
      if (visible(control) && (box.height < 24 || box.width < 16)) problems.push(`small target (${Math.round(box.width)}x${Math.round(box.height)}): ${name(control)}`);
    }
    return problems;
  });
}

test("every screen passes the structural accessibility checks", async ({ page }, info) => {
  test.setTimeout(150_000);
  const suffix = `${info.project.name}-${Date.now()}`;
  await page.goto("/settings");
  await page.getByLabel("Maximum active goals").fill("10");
  await page.getByRole("button", { name: "Save limit" }).click();
  await expect(page.getByRole("status").first()).toHaveText("Active goal limit saved.");
  await page.goto("/topics");
  await page.getByLabel("Topic name").fill(`A11y ${suffix}`);
  await page.getByRole("button", { name: "Create topic" }).click();
  await expect(page.getByRole("heading", { level: 1, name: `A11y ${suffix}` })).toBeVisible();
  const topicUrl = page.url();
  await page.getByRole("link", { name: "Add a goal to this topic" }).click();
  await page.getByLabel("Goal title").fill(`A11y goal ${suffix}`);
  await page.getByLabel("Definition of done").fill("Passes the audit.");
  await page.getByLabel("Starting status").selectOption("active");
  await page.getByRole("button", { name: "Create goal" }).click();
  await expect(page.getByRole("heading", { level: 1, name: `A11y goal ${suffix}` })).toBeVisible();
  const goalUrl = page.url();
  await page.getByRole("link", { name: "Log this week" }).click();
  await page.getByLabel("Built a project").check();
  const build = page.getByRole("group", { name: "Built a project" });
  await build.getByLabel("Description", { exact: true }).fill("Built it.");
  await build.getByLabel("Project", { exact: true }).selectOption("new");
  await build.getByLabel("Project title").fill(`A11y project ${suffix}`);
  await build.getByLabel("Repository URL").fill("https://codeberg.org/owner/a11y");
  const logAudit = await auditPage(page);
  expect(logAudit, "/goals/[id]/log").toEqual([]);
  await page.getByRole("button", { name: "Save log" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved 1 activity." })).toBeVisible();

  await page.goto("/projects");
  await page.getByRole("list", { name: "Projects" }).getByRole("link", { name: `A11y project ${suffix}` }).click();
  await expect(page.getByRole("heading", { level: 1, name: `A11y project ${suffix}` })).toBeVisible();
  const projectUrl = page.url();

  const paths = ["/dashboard", "/topics", topicUrl, "/goals", "/goals/new", goalUrl, "/projects", projectUrl, "/review", "/roadmap", "/settings", "/goals/00000000-0000-4000-8000-000000000000"];
  for (const path of paths) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await auditPage(page), path).toEqual([]);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" }), `${path} skip link`).toBeFocused();
  }

  await page.goto(goalUrl);
  await page.getByLabel("Move goal to").selectOption("planned");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.getByRole("form", { name: "Change goal status" }).getByRole("status")).toHaveText("Goal status updated.");
});

test("the main nav and a form work with the keyboard alone", async ({ page }, info) => {
  await page.goto("/topics");
  await page.waitForLoadState("networkidle");
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "More" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "More" })).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Projects" })).toBeFocused();
    await page.keyboard.press("Escape");
  }
  await page.getByLabel("Topic name").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Description (optional)")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Create topic" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Topic name")).toHaveAccessibleDescription("Enter a topic name.");
});
