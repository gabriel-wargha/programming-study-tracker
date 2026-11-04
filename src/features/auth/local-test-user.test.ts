import { afterEach, expect, test, vi } from "vitest";
import { createLocalTestUser } from "../../../tests/e2e/helpers/create-local-test-user";

const config = {
  supabaseUrl: "http://127.0.0.1:54321",
  appUrl: "http://localhost:3000",
  publishableKey: "sb_publishable_localtest",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("a hosted target is rejected before any request is made", async () => {
  const request = vi.fn();
  vi.stubGlobal("fetch", request);
  await expect(createLocalTestUser({ ...config, supabaseUrl: "https://example.supabase.co" })).rejects.toThrow("loopback");
  expect(request).not.toHaveBeenCalled();
});

test("production execution is rejected before any request is made", async () => {
  const request = vi.fn();
  vi.stubGlobal("fetch", request);
  vi.stubEnv("NODE_ENV", "production");
  await expect(createLocalTestUser(config)).rejects.toThrow("disabled in production");
  expect(request).not.toHaveBeenCalled();
});

test("the local fixture generates unique credentials and reads the Auth session", async () => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("VERCEL", "");
  const request = vi.fn<typeof fetch>().mockImplementation(async () => new Response(JSON.stringify({
    access_token: "test-access-token",
    refresh_token: "test-refresh-token",
    user: { id: "11111111-1111-4111-8111-111111111111" },
  }), { status: 200 }));
  vi.stubGlobal("fetch", request);

  const first = await createLocalTestUser(config);
  const second = await createLocalTestUser(config);
  expect(first.email).not.toBe(second.email);
  expect(first.password).not.toBe(second.password);
  expect(first.accessToken).toBe("test-access-token");
  expect(request.mock.calls[0][0].toString()).toBe("http://127.0.0.1:54321/auth/v1/signup");
});
