import Link from "next/link";
import { StatusPage } from "@/components/status-page";

export default function NotFound() {
  return (
    <StatusPage
      title="Page not found"
      actions={<Link href="/dashboard" className="text-sm font-medium text-primary underline underline-offset-4">Go to the dashboard</Link>}
    >
      <p>This page doesn&apos;t exist, or it isn&apos;t one of yours.</p>
    </StatusPage>
  );
}
