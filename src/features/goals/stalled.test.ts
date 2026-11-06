import { describe, expect, test } from "vitest";
import { daysWithoutActivity, isStalled } from "@/features/goals/stalled";

const today = "2026-11-05";
const goal = (values: Partial<{ status: string; lastActivityOn: string | null; startedOn: string | null }>) =>
  ({ status: "active", lastActivityOn: null, startedOn: "2026-10-01", ...values });

describe("stalled goals", () => {
  test("a goal stalls after 14 days without activity, not before", () => {
    expect(isStalled(goal({ lastActivityOn: "2026-10-23" }), today)).toBe(false); // 13 days
    expect(isStalled(goal({ lastActivityOn: "2026-10-22" }), today)).toBe(true); // 14 days
  });

  test("with no activity, the 14 days start from when the goal started", () => {
    expect(isStalled(goal({ startedOn: "2026-10-23" }), today)).toBe(false);
    expect(isStalled(goal({ startedOn: "2026-10-22" }), today)).toBe(true);
  });

  test("recent activity counts even when the goal started long ago", () => {
    expect(isStalled(goal({ startedOn: "2020-01-01", lastActivityOn: "2026-11-01" }), today)).toBe(false);
  });

  test.each(["planned", "completed", "archived"])("%s goals never stall", (status) => {
    expect(isStalled(goal({ status, lastActivityOn: "2020-01-01" }), today)).toBe(false);
  });

  test("a goal with nothing to count from is not stalled", () => {
    expect(isStalled(goal({ startedOn: null }), today)).toBe(false);
    expect(daysWithoutActivity({ lastActivityOn: null, startedOn: null }, today)).toBeNull();
  });
});
