import { useSyncExternalStore } from "react";
import { localToday } from "@/lib/dates/weeks";

const subscribe = () => () => {};

/**
 * The browser's calendar date, or null while rendering on the server, which
 * does not know the owner's time zone.
 */
export function useLocalToday(): string | null {
  return useSyncExternalStore(subscribe, () => localToday(), () => null);
}
