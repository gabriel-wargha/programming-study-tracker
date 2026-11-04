"use client";

import { useActionState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AuthActionState } from "@/features/auth/schemas";

type AuthFormProps = {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  intent: "github" | "sign-out";
  error?: string;
  disabled?: boolean;
};

export function AuthForm({ action, intent, error, disabled = false }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, null);
  const signingIn = intent === "github";
  const message = state?.ok === false ? state.error : error;

  return (
    <form action={formAction} className="space-y-3" aria-label={signingIn ? "GitHub sign-in" : "Sign out"}>
      <input type="hidden" name="intent" value={intent} />
      <Button
        type="submit"
        variant={signingIn ? "default" : "outline"}
        size={signingIn ? "lg" : "default"}
        className={signingIn ? "w-full" : undefined}
        disabled={disabled || pending}
        aria-busy={pending}
      >
        {pending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> :
          !signingIn ? <LogOut aria-hidden="true" /> : null}
        {pending ? (signingIn ? "Connecting to GitHub…" : "Signing out…") :
          signingIn ? "Continue with GitHub" : "Sign out"}
      </Button>
      {message && <p role="alert" className="max-w-sm text-sm leading-6 text-destructive">{message}</p>}
    </form>
  );
}
