/** The browser stores its time zone here so the server can work out the owner's "today". */
export const TIME_ZONE_COOKIE = "study_time_zone";

/** True for an IANA time zone name the runtime understands, such as "America/Sao_Paulo". */
export function isTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !value || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
