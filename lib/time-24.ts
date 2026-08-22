const TIME_24_PATTERN = /^\s*(\d{1,2}):(\d{1,2})(?:\s*(SA|CH|AM|PM))?\s*$/i;

export function normalizeTime24(value: unknown, fallback = "09:00"): string {
  if (typeof value !== "string") return fallback;
  const match = value.match(TIME_24_PATTERN);
  if (!match) return fallback;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (minute < 0 || minute > 59) return fallback;

  if (period) {
    if (hour < 1 || hour > 12) return fallback;
    if (period === "SA" || period === "AM") hour = hour === 12 ? 0 : hour;
    else hour = hour === 12 ? 12 : hour + 12;
  } else if (hour < 0 || hour > 23) {
    return fallback;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function compareTime24(first: string, second: string): number {
  return normalizeTime24(first).localeCompare(normalizeTime24(second));
}
