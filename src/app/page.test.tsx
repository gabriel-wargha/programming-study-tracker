import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";

import HomePage from "@/app/page";

test("the starter page exposes its approach through a keyboard-accessible link", async () => {
  const user = userEvent.setup();
  render(<HomePage />);

  expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Small steps.Real progress.");

  await user.tab();
  await user.tab();

  const approachLink = screen.getByRole("link", { name: "See the approach" });
  expect(approachLink).toHaveFocus();
  expect(approachLink).toHaveAttribute("href", "#how-it-works");
  expect(screen.getByRole("region", { name: "A simple rhythm for learning" })).toHaveAttribute("id", "how-it-works");
});
