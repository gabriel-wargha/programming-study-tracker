import { describe, expect, test } from "vitest";
import { isLocalOwnerAllowed } from "@/lib/auth/local-owner";

describe("isLocalOwnerAllowed", () => {
  test("allows only next dev with LOCAL_OWNER_MODE=1", () => {
    expect(isLocalOwnerAllowed({ NODE_ENV: "development", LOCAL_OWNER_MODE: "1" })).toBe(true);
  });

  test.each([
    ["a production build", { NODE_ENV: "production", LOCAL_OWNER_MODE: "1" }],
    ["the test runner", { NODE_ENV: "test", LOCAL_OWNER_MODE: "1" }],
    ["a missing flag", { NODE_ENV: "development" }],
    ["a flag other than 1", { NODE_ENV: "development", LOCAL_OWNER_MODE: "true" }],
    ["Vercel", { NODE_ENV: "development", LOCAL_OWNER_MODE: "1", VERCEL: "1" }],
    ["a configured Neon database", { NODE_ENV: "development", LOCAL_OWNER_MODE: "1", DATABASE_URL: "postgresql://x" }],
    ["an empty environment", {}],
  ])("fails closed for %s", (_label, env) => {
    expect(isLocalOwnerAllowed(env)).toBe(false);
  });
});
