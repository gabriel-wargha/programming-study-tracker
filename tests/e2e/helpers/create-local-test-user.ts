import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";

import { assertLocalTestEnvironment } from "./local-environment";

const sessionSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  user: z.object({ id: z.uuid() }),
});

/** Uses real local Auth. This is a test fixture, never an application endpoint. */
export async function createLocalTestUser({
  supabaseUrl,
  appUrl,
  publishableKey,
}: {
  supabaseUrl: string;
  appUrl: string;
  publishableKey: string;
}) {
  assertLocalTestEnvironment({ supabaseUrl, appUrl, vercel: process.env.VERCEL });
  if (process.env.NODE_ENV === "production") {
    throw new Error("Test-user creation is disabled in production.");
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) {
    throw new Error("Local tests require a Supabase publishable key.");
  }

  const email = `e2e-${randomUUID()}@example.test`;
  const password = randomBytes(32).toString("base64url");
  const response = await fetch(new URL("/auth/v1/signup", supabaseUrl), {
    method: "POST",
    headers: { apikey: publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error("Local test-user creation failed. Check the local Auth configuration.");
  }

  const body: unknown = await response.json();
  const session = sessionSchema.safeParse(body);
  if (!session.success) {
    throw new Error("Local tests need email confirmations disabled in local Supabase.");
  }
  return {
    email,
    password,
    userId: session.data.user.id,
    accessToken: session.data.access_token,
    refreshToken: session.data.refresh_token,
  };
}
