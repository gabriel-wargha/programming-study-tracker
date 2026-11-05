"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/status-page";

export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  const digest = error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : null;

  return (
    <div role="alert">
      <StatusPage
        title="Something went wrong"
        actions={<>
          <Button type="button" onClick={() => retry()}>Try again</Button>
          <Link href="/dashboard" className="text-sm font-medium text-primary underline underline-offset-4">Go to the dashboard</Link>
        </>}
      >
        <p>This page couldn&apos;t load. Your saved data is safe. Try again in a moment.</p>
        {digest && <p className="mt-2 text-xs">Error reference: <code>{digest}</code></p>}
      </StatusPage>
    </div>
  );
}
