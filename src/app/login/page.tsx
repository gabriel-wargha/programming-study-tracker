import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signInWithGitHub } from "@/features/auth/actions";
import { LoginPanel } from "@/features/auth/components/login-panel";
import { getLoginError } from "@/features/auth/schemas";
import { getCurrentUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Sign in · Programming Study Tracker" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { error } = await searchParams;
  // GitHub sign-in becomes available when Neon Auth is connected in Phase 8.
  return <LoginPanel action={signInWithGitHub} error={getLoginError(error)} available={false} />;
}
