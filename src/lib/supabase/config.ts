import { z } from "zod";

export function isLoopbackUrl(value: URL) {
  return ["localhost", "127.0.0.1", "[::1]"].includes(value.hostname);
}

const serviceUrlSchema = z.url().refine((value) => {
  const url = new URL(value);
  return (
    !url.username &&
    !url.password &&
    (url.protocol === "https:" ||
      (url.protocol === "http:" && isLoopbackUrl(url)))
  );
}, "Use HTTPS, or HTTP on a local loopback address.");

export const supabaseConfigSchema = z.object({
  url: serviceUrlSchema,
  publishableKey: z.string().regex(/^sb_publishable_[A-Za-z0-9_-]+$/)
    .refine((value) => value !== "sb_publishable_replace_me"),
});

export function readSupabaseConfig() {
  // Explicit accesses let Next.js inline these public values in the browser.
  const result = supabaseConfigSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return result.success ? result.data : null;
}

export function requireSupabaseConfig() {
  const config = readSupabaseConfig();
  if (!config) throw new Error("Supabase URL and publishable key are not configured.");
  return config;
}

export function getSiteUrl() {
  const configured = serviceUrlSchema.parse(process.env.NEXT_PUBLIC_SITE_URL);
  const url = new URL(configured);
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL must contain only the site origin.");
  }
  return url.origin;
}
