import Link from "next/link";
import { StatusPage } from "@/components/status-page";

export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="flex flex-1 items-center px-4 py-16 focus:outline-none">
      <StatusPage
        title="Page not found"
        actions={<Link href="/dashboard" className="text-sm font-medium text-primary underline underline-offset-4">Go to the dashboard</Link>}
      >
        <p>This page doesn&apos;t exist.</p>
      </StatusPage>
    </main>
  );
}
