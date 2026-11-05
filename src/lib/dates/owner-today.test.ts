// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";

const cookieValue = vi.hoisted(() => ({ current: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (cookieValue.current === undefined ? undefined : { value: cookieValue.current }) }),
}));

const { getOwnerCalendar } = await import("@/lib/dates/owner-today");
const { isTimeZone } = await import("@/lib/dates/time-zone");

// Thursday evening in Brazil is already Friday in UTC; Sunday night in Brazil is Monday in UTC.
const thursdayEvening = new Date("2026-11-06T01:30:00Z");
const sundayNight = new Date("2026-11-09T01:30:00Z");

beforeEach(() => { cookieValue.current = undefined; });

test("only real time zone names are accepted", () => {
  expect(isTimeZone("America/Sao_Paulo")).toBe(true);
  expect(isTimeZone("UTC")).toBe(true);
  expect(isTimeZone("Mars/Olympus")).toBe(false);
  expect(isTimeZone("")).toBe(false);
  expect(isTimeZone(42)).toBe(false);
});

test("the owner's today and week follow the time zone their browser reported", async () => {
  cookieValue.current = "America/Sao_Paulo";
  expect(await getOwnerCalendar(thursdayEvening)).toEqual({
    timeZone: "America/Sao_Paulo", today: "2026-11-05", week: { start: "2026-11-02", end: "2026-11-08" },
  });
  expect((await getOwnerCalendar(sundayNight)).week.start).toBe("2026-11-02");
});

test("a missing or invalid time zone falls back to UTC", async () => {
  expect(await getOwnerCalendar(sundayNight)).toMatchObject({ timeZone: "UTC", today: "2026-11-09" });
  cookieValue.current = "not/a-zone";
  expect((await getOwnerCalendar(sundayNight)).week.start).toBe("2026-11-09");
});
