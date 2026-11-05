"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TIME_ZONE_COOKIE } from "@/lib/dates/time-zone";

/** Shares the browser's time zone with the server, then refreshes if it changed. */
export function TimeZoneSync() {
  const router = useRouter();
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!zone) return;
    const saved = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${TIME_ZONE_COOKIE}=`));
    if (saved && decodeURIComponent(saved.slice(TIME_ZONE_COOKIE.length + 1)) === zone) return;
    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(zone)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router]);
  return null;
}
