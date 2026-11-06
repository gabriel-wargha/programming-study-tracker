/** "45 min", "2 h", or "1 h 30 min". */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** A compact form for tight spaces: "45m", "2h", "1h30". */
export function formatMinutesShort(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours}h`;
}
