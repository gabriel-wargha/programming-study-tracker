import { z } from "zod";

const slugMessage = "Use 3 to 60 lowercase letters, numbers, and single hyphens.";

export const portfolioSettingsSchema = z.object({
  enabled: z.boolean(),
  slug: z.string().trim().transform((value) => value || null)
    .pipe(z.string().min(3, slugMessage).max(60, slugMessage).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, slugMessage).nullable()),
  displayName: z.string().trim().max(100, "Use 100 characters or fewer.").transform((value) => value || null),
  headline: z.string().trim().max(200, "Use 200 characters or fewer.").transform((value) => value || null),
  githubUsername: z.string().trim().transform((value) => value || null)
    .pipe(z.string().max(39, "Enter a valid GitHub username.").regex(/^[A-Za-z0-9](-?[A-Za-z0-9])*$/, "Enter a valid GitHub username.").nullable()),
}).strict().superRefine((value, ctx) => {
  if (value.enabled && !value.slug) ctx.addIssue({ code: "custom", path: ["slug"], message: "Choose a page address to turn on your portfolio." });
});

export type PortfolioField = keyof z.input<typeof portfolioSettingsSchema>;
export type PortfolioInput = z.output<typeof portfolioSettingsSchema>;
export type PortfolioFormValues = { enabled: boolean; slug: string; displayName: string; headline: string; githubUsername: string };

export function readPortfolioForm(formData: FormData) {
  return {
    enabled: formData.get("enabled") === "on",
    slug: formData.get("slug") ?? "",
    displayName: formData.get("displayName") ?? "",
    headline: formData.get("headline") ?? "",
    githubUsername: formData.get("githubUsername") ?? "",
  };
}
