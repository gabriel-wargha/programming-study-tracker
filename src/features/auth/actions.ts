"use server";

import { signInSchema, type AuthActionState } from "@/features/auth/schemas";

/** GitHub sign-in through Neon Auth is connected in Phase 8. */
export async function signInWithGitHub(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({ intent: formData.get("intent") });
  if (!parsed.success) return { ok: false, error: "Please try signing in again." };
  return { ok: false, error: "Sign-in is temporarily unavailable. Please try again later." };
}
