import { z } from "zod";

/**
 * Week helpers for calendar dates (`YYYY-MM-DD`), matching PostgreSQL `date`.
 * Weeks run from Monday through Sunday. Dates are calculated in UTC so the
 * result never depends on the server's or browser's time zone.
 */

const calendarDate = z.iso.date();
const dayInMs = 86_400_000;

function toUtc(date: string): Date {
  return new Date(`${calendarDate.parse(date)}T00:00:00Z`);
}

function fromUtc(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return fromUtc(new Date(toUtc(date).getTime() + days * dayInMs));
}

/** The Monday on or before `date`. */
export function startOfWeek(date: string): string {
  const day = toUtc(date).getUTCDay(); // 0 is Sunday
  return addDays(date, -((day + 6) % 7));
}

/** The Sunday on or after `date`. */
export function endOfWeek(date: string): string {
  return addDays(startOfWeek(date), 6);
}

export function weekRange(date: string): { start: string; end: string } {
  const start = startOfWeek(date);
  return { start, end: addDays(start, 6) };
}

/** Today's calendar date in a time zone, such as "America/Sao_Paulo". */
export function todayInTimeZone(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Today's date on the device running this code, such as the owner's browser. */
export function localToday(now = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * The latest date that is not in the future anywhere on Earth (UTC+14).
 * The server does not know the owner's time zone, so it uses this bound; the
 * database trigger uses the same one.
 */
export function latestActivityDate(now = new Date()): string {
  return todayInTimeZone("Pacific/Kiritimati", now);
}

/** "Nov 2 – 8, 2026" for the week that starts on `start`. */
export function formatWeekRange(start: string): string {
  const format = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  // ICU uses thin spaces around the dash; plain spaces keep the label predictable.
  return format.formatRange(toUtc(start), toUtc(addDays(start, 6))).replace(/\s/g, " ");
}
