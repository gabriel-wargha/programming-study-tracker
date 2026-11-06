import { describe, expect, test } from "vitest";
import { activityLevel, buildCalendar, calendarDayLabel, calendarStart } from "@/features/dashboard/calendar";

const today = "2026-11-05"; // a Thursday

describe("the activity calendar", () => {
  test("covers the last 12 months in whole Monday-first weeks", () => {
    const { start, cells, columns } = buildCalendar([], today);
    expect(start).toBe("2025-11-06");
    expect(cells.length).toBe(columns * 7);
    expect(cells[0].date).toBe("2025-11-03"); // the Monday before the first day
    expect(cells.filter((cell) => cell.kind === "day")).toHaveLength(365);
    expect(cells.find((cell) => cell.date === "2025-11-05")?.kind).toBe("blank");
    expect(cells.find((cell) => cell.date === "2026-11-06")?.kind).toBe("blank");
    expect(cells.at(-1)?.date).toBe("2026-11-08");
  });

  test("a last day that is a Sunday does not add an empty week", () => {
    const { cells } = buildCalendar([], "2026-11-08");
    expect(cells.at(-1)?.date).toBe("2026-11-08");
    expect(cells.length % 7).toBe(0);
  });

  test("more activities mean a darker level", () => {
    expect([0, 1, 2, 3, 4, 5, 20].map(activityLevel)).toEqual([0, 1, 2, 3, 3, 4, 4]);
  });

  test("each day has a text label with its date, count, and time", () => {
    expect(calendarDayLabel("2026-11-02", 0, 0)).toBe("Nov 2, 2026: 0 activities");
    expect(calendarDayLabel("2026-11-02", 1, 0)).toBe("Nov 2, 2026: 1 activity, no time recorded");
    expect(calendarDayLabel("2026-11-02", 3, 90)).toBe("Nov 2, 2026: 3 activities, 1 h 30 min");
  });

  test("study days count only days in range", () => {
    const { studyDays, cells } = buildCalendar([
      { date: "2026-11-02", count: 2, minutes: 30 }, { date: "2020-01-01", count: 9, minutes: 0 },
    ], today);
    expect(studyDays).toBe(1);
    expect(cells.find((cell) => cell.date === "2026-11-02")).toMatchObject({ kind: "day", level: 2 });
  });

  test("a leap day has a valid start", () => {
    expect(calendarStart("2028-02-29")).toBe("2027-03-01");
  });
});
