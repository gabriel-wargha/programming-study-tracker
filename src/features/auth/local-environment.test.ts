import { expect, test } from "vitest";
import { assertLocalTestEnvironment } from "../../../tests/e2e/helpers/local-environment";

const local = { supabaseUrl: "http://127.0.0.1:54321", appUrl: "http://localhost:3000" };

test("the future test-user fixture accepts only a local development stack", () => {
  expect(() => assertLocalTestEnvironment(local)).not.toThrow();
});

test.each([
  { ...local, supabaseUrl: "https://example.supabase.co" },
  { ...local, supabaseUrl: "http://127.0.0.1:54322" },
  { ...local, supabaseUrl: "http://127.0.0.1.evil.example:54321" },
  { ...local, supabaseUrl: "http://user:password@127.0.0.1:54321" },
  { ...local, appUrl: "https://study.example.com" },
  { ...local, vercel: "1" },
])("refuses to create a test user outside the local environment: %j", (environment) => {
  expect(() => assertLocalTestEnvironment(environment)).toThrow("Test users can only be created");
});
