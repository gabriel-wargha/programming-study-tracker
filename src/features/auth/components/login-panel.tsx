import { BookOpen, Code2 } from "lucide-react";
import { AuthForm } from "@/features/auth/components/auth-form";
import type { AuthActionState } from "@/features/auth/schemas";

type LoginPanelProps = {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  error?: string;
  available?: boolean;
};

export function LoginPanel({ action, error, available = true }: LoginPanelProps) {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center px-6 py-12 sm:px-10">
      <div className="mb-14 flex items-center gap-3 font-semibold">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Code2 aria-hidden="true" className="size-5" />
        </span>
        Programming Study Tracker
      </div>
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
        <div>
          <p className="mb-5 text-xs font-semibold tracking-[0.18em] text-primary uppercase">One step at a time</p>
          <h1 className="text-5xl leading-tight font-semibold tracking-tight sm:text-6xl">Small steps.<br /><span className="text-primary">Real progress.</span></h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-muted-foreground">Keep your programming study focused. Set a clear goal, record the work, and keep what you build.</p>
        </div>
        <section aria-labelledby="login-heading" className="rounded-2xl border bg-card p-7 shadow-sm sm:p-10">
          <BookOpen aria-hidden="true" className="mb-6 size-7 text-primary" />
          <h2 id="login-heading" className="text-2xl font-semibold tracking-tight">Your study workspace</h2>
          <p className="mt-3 mb-8 text-sm leading-6 text-muted-foreground">Sign in with GitHub to pick up where you left off. Your study activity stays private.</p>
          <AuthForm action={action} intent="github" error={error} disabled={!available} />
          {!available && <p role="status" className="mt-3 text-sm leading-6 text-muted-foreground">Sign-in is not available yet. Please try again later.</p>}
        </section>
      </div>
    </main>
  );
}
