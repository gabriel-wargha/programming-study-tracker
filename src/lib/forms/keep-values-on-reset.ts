import type { FormEvent } from "react";

/**
 * React resets a form after its action runs, and a controlled `<select>` or radio
 * then shows the wrong choice while its state keeps the old one. Forms that manage
 * their own values cancel that reset with `onReset={keepValuesOnReset}`.
 */
export function keepValuesOnReset(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
}
