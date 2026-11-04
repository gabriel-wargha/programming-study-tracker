import { afterEach, expect, test, vi } from "vitest";
import { getSiteUrl, readSupabaseConfig, supabaseConfigSchema } from "@/lib/supabase/config";

afterEach(() => vi.unstubAllEnvs());

const valid = {
  url: "https://example.supabase.co",
  publishableKey: "sb_publishable_example123",
};

test.each(["eyJhbGciOiJIUzI1NiJ9.legacy-key", "sb_secret_example", "sb_publishable_replace_me"])(
  "rejects legacy, secret, and placeholder credentials: %s", (key) => {
    expect(supabaseConfigSchema.safeParse({ ...valid, publishableKey: key }).success).toBe(false);
  },
);

test.each(["http://example.com", "https://user:password@example.com", "ftp://example.com"])(
  "rejects insecure or credential-bearing service URLs: %s", (url) => {
    expect(supabaseConfigSchema.safeParse({ ...valid, url }).success).toBe(false);
  },
);

test.each(["http://localhost:54321", "http://127.0.0.1:54321", "https://example.supabase.co"])(
  "allows HTTPS and loopback development: %s", (url) => {
    expect(supabaseConfigSchema.safeParse({ ...valid, url }).success).toBe(true);
  },
);

test("missing configuration does not pretend authentication is available", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);
  expect(readSupabaseConfig()).toBeNull();
});

test("the OAuth return origin comes from configuration", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://study.example.com");
  expect(getSiteUrl()).toBe("https://study.example.com");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://study.example.com/unexpected?next=evil");
  expect(() => getSiteUrl()).toThrow();
});
