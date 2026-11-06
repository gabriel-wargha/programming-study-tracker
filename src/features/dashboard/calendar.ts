import { formatMinutes } from "@/lib/dates/format-minutes";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";
import { addDays, daysBetween, startOfWeek } from "@/lib/dates/weeks";

export type CalendarCell =
  | { kind: "blank"; date: string }
  | { kind: "day"; date: string; count: number; minutes: number; level: 0 | 1 | 2 | 3 | 4; label: string };

/** Darker cells mean more activities on that day. */
export function activityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return count <= 4 ? 3 : 4;
}

export function calendarDayLabel(date: string, count: number, minutes: number) {
  const activities = count === 1 ? "1 activity" : `${count} activities`;
  return `${formatCalendarDate(date)}: ${activities}${count ? `, ${minutes ? formatMinutes(minutes) : "no time recorded"}` : ""}`;
}

/** The first day shown: one year back from today, plus a day. */
export function calendarStart(today: string) {
  const year = Number(today.slice(0, 4)) - 1;
  const monthDay = today.slice(5) === "02-29" ? "02-28" : today.slice(5);
  return addDays(`${year}-${monthDay}`, 1);
}

/**
 * Cells for the last 12 months in Monday-first weeks, oldest first. Days before
 * the range and after today are blank, so every week column has seven cells.
 */
export function buildCalendar(days: { date: string; count: number; minutes: number }[], today: string) {
  const start = calendarStart(today);
  const first = startOfWeek(start);
  const total = (daysBetween(first, today) + 7 - (daysBetween(first, today) % 7));
  const byDate = new Map(days.map((day) => [day.date, day]));
  const cells: CalendarCell[] = Array.from({ length: total }, (_, index) => {
    const date = addDays(first, index);
    if (date < start || date > today) return { kind: "blank", date };
    const day = byDate.get(date);
    const count = day?.count ?? 0;
    const minutes = day?.minutes ?? 0;
    return { kind: "day", date, count, minutes, level: activityLevel(count), label: calendarDayLabel(date, count, minutes) };
  });

  // A month label sits above the first week that starts in that month.
  const months: { column: number; label: string }[] = [];
  const format = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
  for (let column = 0; column * 7 < total; column += 1) {
    const monday = addDays(first, column * 7);
    // The last two columns are too narrow to fit a label.
    if (Number(monday.slice(8)) <= 7 && (column + 2) * 7 < total) months.push({ column, label: format.format(new Date(`${monday}T00:00:00Z`)) });
  }
  return {
    start,
    cells,
    months,
    columns: total / 7,
    studyDays: days.filter((day) => day.date >= start && day.date <= today && day.count > 0).length,
  };
}
