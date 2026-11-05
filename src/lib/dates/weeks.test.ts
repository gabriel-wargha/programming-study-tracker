import { describe, expect, test } from "vitest";
import { formatMinutes } from "@/lib/dates/format-minutes";
import {
  addDays, endOfWeek, formatWeekRange, latestActivityDate, localToday, startOfWeek, todayInTimeZone, weekRange,
} from "@/lib/dates/weeks";

describe("Monday-to-Sunday weeks", () => {
  // November 2, 2026 is a Monday.
  test.each([
    ["2026-11-02", "2026-11-02"],
    ["2026-11-05", "2026-11-02"],
    ["2026-11-08", "2026-11-02"],
    ["2026-11-09", "2026-11-09"],
  ])("the week of %s starts on %s", (date, monday) => {
    expect(startOfWeek(date)).toBe(monday);
    expect(endOfWeek(date)).toBe(addDays(monday, 6));
  });

  test("weeks cross month and year boundaries", () => {
    expect(weekRange("2027-01-01")).toEqual({ start: "2026-12-28", end: "2027-01-03" });
    expect(weekRange("2026-03-01")).toEqual({ start: "2026-02-23", end: "2026-03-01" });
  });

  test("leap days and daylight saving changes do not shift dates", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-02-29", 1)).toBe("2028-03-01");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
    expect(addDays("2026-11-02", -7)).toBe("2026-10-26");
  });

  test("invalid calendar dates are rejected", () => {
    expect(() => startOfWeek("2026-02-30")).toThrow();
    expect(() => startOfWeek("not a date")).toThrow();
  });

  test("week ranges have a readable label", () => {
    expect(formatWeekRange("2026-11-02")).toBe("Nov 2 – 8, 2026");
    expect(formatWeekRange("2026-12-28")).toBe("Dec 28, 2026 – Jan 3, 2027");
  });
});

describe("today", () => {
  const lateEveningInBrazil = new Date("2026-11-06T01:30:00Z");

  test("depends on the time zone", () => {
    expect(todayInTimeZone("America/Sao_Paulo", lateEveningInBrazil)).toBe("2026-11-05");
    expect(todayInTimeZone("UTC", lateEveningInBrazil)).toBe("2026-11-06");
  });

  test("the latest activity date is not in the future anywhere on Earth", () => {
    expect(latestActivityDate(new Date("2026-11-05T09:59:00Z"))).toBe("2026-11-05");
    expect(latestActivityDate(new Date("2026-11-05T10:00:00Z"))).toBe("2026-11-06");
  });

  test("the local date uses the device's calendar", () => {
    expect(localToday(new Date(2026, 10, 5, 23, 59))).toBe("2026-11-05");
  });
});

test("minutes are shown in hours and minutes", () => {
  expect(formatMinutes(45)).toBe("45 min");
  expect(formatMinutes(120)).toBe("2 h");
  expect(formatMinutes(90)).toBe("1 h 30 min");
  expect(formatMinutes(1440)).toBe("24 h");
});
