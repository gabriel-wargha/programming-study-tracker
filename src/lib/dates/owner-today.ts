import "server-only";

import { cookies } from "next/headers";
import { isTimeZone, TIME_ZONE_COOKIE } from "@/lib/dates/time-zone";
import { todayInTimeZone, weekRange } from "@/lib/dates/weeks";

/**
 * The owner's current date and week, using the time zone their browser reported.
 * Until the browser reports one, UTC is used.
 */
export async function getOwnerCalendar(now = new Date()) {
  const reported = (await cookies()).get(TIME_ZONE_COOKIE)?.value;
  const timeZone = isTimeZone(reported) ? reported : "UTC";
  const today = todayInTimeZone(timeZone, now);
  return { timeZone, today, week: weekRange(today) };
}
