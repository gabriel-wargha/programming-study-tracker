import { act } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { LoginPanel } from "@/features/auth/components/login-panel";
import type { AuthActionState } from "@/features/auth/schemas";

test("GitHub sign-in has a pending state and displays an expected failure", async () => {
  const user = userEvent.setup();
  let settle: ((state: AuthActionState) => void) | undefined;
  const action = vi.fn(() => new Promise<AuthActionState>((resolve) => { settle = resolve; }));
  render(<LoginPanel action={action} />);

  const button = screen.getByRole("button", { name: "Continue with GitHub" });
  await user.tab();
  expect(button).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("button", { name: "Connecting to GitHub…" })).toBeDisabled();
  expect(action.mock.calls[0]).toBeDefined();

  await act(async () => { settle?.({ ok: false, error: "Please try signing in again." }); });
  expect(screen.getByRole("alert")).toHaveTextContent("Please try signing in again.");
  expect(screen.getByRole("button", { name: "Continue with GitHub" })).toBeEnabled();
});

test("unconfigured sign-in is unavailable and explains its state", () => {
  render(<LoginPanel action={vi.fn()} available={false} />);
  expect(screen.getByRole("button", { name: "Continue with GitHub" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Sign-in is not available yet.");
});
