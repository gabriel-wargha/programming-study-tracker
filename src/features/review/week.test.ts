import { expect, test } from "vitest";
import { resolveReviewWeek } from "@/features/review/week";

const today = "2026-11-05";

test("the review defaults to the current week", () => {
  expect(resolveReviewWeek(undefined, today)).toEqual({
    start: "2026-11-02", end: "2026-11-08", isCurrent: true, previous: "2026-10-26", next: null,
  });
});

test("any date selects the week that contains it", () => {
  expect(resolveReviewWeek("2026-10-30", today)).toMatchObject({
    start: "2026-10-26", end: "2026-11-01", isCurrent: false, next: "2026-11-02",
  });
});

test.each(["nonsense", "2026-02-30", "2026-11-09", ["2026-10-30"]])("%j falls back to the current week", (value) => {
  expect(resolveReviewWeek(value, today).start).toBe("2026-11-02");
});
