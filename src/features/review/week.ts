import { z } from "zod";
import { addDays, startOfWeek } from "@/lib/dates/weeks";

const isoDate = z.iso.date();

/** The Monday of the requested week. Bad values and future weeks become the current week. */
export function resolveReviewWeek(requested: unknown, today: string) {
  const current = startOfWeek(today);
  const parsed = isoDate.safeParse(requested);
  const start = parsed.success && startOfWeek(parsed.data) <= current ? startOfWeek(parsed.data) : current;
  return {
    start,
    end: addDays(start, 6),
    isCurrent: start === current,
    previous: addDays(start, -7),
    next: start === current ? null : addDays(start, 7),
  };
}
