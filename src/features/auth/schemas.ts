import { z } from "zod";

export const signInSchema = z.object({ intent: z.literal("github") });
export const signOutSchema = z.object({ intent: z.literal("sign-out") });

export type AuthActionState =
  | { ok: true; data: null }
  | { ok: false; error: string }
  | null;

export const loginErrorSchema = z.enum(["callback", "provider", "unavailable"]);

export function getLoginError(value: unknown): string | undefined {
  const result = loginErrorSchema.safeParse(value);
  if (!result.success) return undefined;

  const messages: Record<z.infer<typeof loginErrorSchema>, string> = {
    callback: "We couldn't finish signing you in. Please try again.",
    provider: "GitHub sign-in was cancelled or couldn't be completed. Please try again.",
    unavailable: "Sign-in is temporarily unavailable. Please try again later.",
  };
  return messages[result.data];
}
