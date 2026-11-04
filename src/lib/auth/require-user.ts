import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDatabase } from "@/db/client";
import { isLocalOwnerAllowed, LOCAL_OWNER_ID, LOCAL_OWNER_NAME } from "@/lib/auth/local-owner";
import { ensureProfile } from "@/lib/auth/profile";

export type SessionUser = {
  id: string;
  displayName: string | null;
  isLocalOwner: boolean;
};

/** The verified user for this request, or null. Memoized per render pass. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  // User checks always run per request, never during prerendering.
  await connection();
  if (isLocalOwnerAllowed(process.env)) {
    await ensureProfile(await getDatabase(), LOCAL_OWNER_ID, LOCAL_OWNER_NAME);
    return { id: LOCAL_OWNER_ID, displayName: LOCAL_OWNER_NAME, isLocalOwner: true };
  }
  // Neon Auth sessions are added in Phase 8. Until then, everyone else is signed out.
  return null;
});

/** Call in every protected page, query, and Server Action. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
