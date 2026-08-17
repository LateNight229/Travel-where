import type { TripDay, TripDocument, TripSettingsInput } from "./trip-types";

const DAY_MS = 24 * 60 * 60 * 1000;

function asLocalDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(asLocalDate(value).getTime());
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function addDaysIso(iso: string, amount: number): string {
  const date = asLocalDate(iso);
  date.setDate(date.getDate() + amount);
  return toIsoDate(date);
}

export function tripDayCount(startDate: string, endDate: string): number {
  const start = asLocalDate(startDate).getTime();
  const end = asLocalDate(endDate).getTime();
  return Math.max(1, Math.round((end - start) / DAY_MS) + 1);
}

function formatLongDate(iso: string): string {
  const value = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(asLocalDate(iso));
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(asLocalDate(iso));
}

export function formatTripDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) {
    return new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "long", year: "numeric" }).format(asLocalDate(startDate));
  }
  const start = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(asLocalDate(startDate));
  const end = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(asLocalDate(endDate));
  return `${start} – ${end}`;
}

export function buildTripDays(startDate: string, endDate: string, currentDays: TripDay[] = []): TripDay[] {
  return Array.from({ length: tripDayCount(startDate, endDate) }, (_, index) => {
    const dateISO = addDaysIso(startDate, index);
    const current = currentDays[index];
    return {
      id: current?.id ?? crypto.randomUUID(),
      label: `Ngày ${index + 1}`,
      dateISO,
      date: formatLongDate(dateISO),
      shortDate: formatShortDate(dateISO),
      places: Array.isArray(current?.places) ? current.places : [],
    };
  });
}

export function createTripDocument(position: number, settings?: Partial<TripSettingsInput>): TripDocument {
  const startDate = settings?.startDate && isIsoDate(settings.startDate) ? settings.startDate : todayIso();
  const requestedEnd = settings?.endDate && isIsoDate(settings.endDate) ? settings.endDate : startDate;
  const endDate = requestedEnd < startDate ? startDate : requestedEnd;
  const title = settings?.title?.trim() || `Chuyến đi ${position}`;
  return {
    id: crypto.randomUUID(),
    position,
    title,
    destination: settings?.destination?.trim() || "",
    startDate,
    endDate,
    dateRange: formatTripDateRange(startDate, endDate),
    travelers: Math.max(1, Number(settings?.travelers) || 1),
    updatedAt: new Date().toISOString(),
    days: buildTripDays(startDate, endDate),
    hotelShortlist: [],
  };
}

function inferLegacyStartDate(document: Record<string, unknown>): string {
  if (isIsoDate(document.startDate)) return document.startDate;
  const range = typeof document.dateRange === "string" ? document.dateRange : "";
  const match = range.match(/(\d{1,2})[–-](\d{1,2})\s+tháng\s+(\d{1,2}),\s*(\d{4})/i);
  if (match) {
    return `${match[4]}-${String(match[3]).padStart(2, "0")}-${String(match[1]).padStart(2, "0")}`;
  }
  return todayIso();
}

export function normalizeTripDocument(value: unknown, fallbackId: string, position: number): TripDocument | null {
  if (!value || typeof value !== "object") return null;
  const document = value as Record<string, unknown>;
  const legacyDays = Array.isArray(document.days) ? (document.days as TripDay[]) : [];
  const startDate = inferLegacyStartDate(document);
  const inferredEnd = addDaysIso(startDate, Math.max(legacyDays.length - 1, 0));
  const endDate = isIsoDate(document.endDate) && document.endDate >= startDate ? document.endDate : inferredEnd;
  const days = buildTripDays(startDate, endDate, legacyDays);

  return {
    id: fallbackId || (typeof document.id === "string" && document.id ? document.id : crypto.randomUUID()),
    position: Math.max(1, Number(document.position) || position),
    title: typeof document.title === "string" && document.title.trim() ? document.title.trim() : `Chuyến đi ${position}`,
    destination: typeof document.destination === "string" ? document.destination : "",
    startDate,
    endDate,
    dateRange: formatTripDateRange(startDate, endDate),
    travelers: Math.max(1, Number(document.travelers) || 1),
    updatedAt: typeof document.updatedAt === "string" ? document.updatedAt : new Date().toISOString(),
    days,
    hotelShortlist: Array.isArray(document.hotelShortlist) ? document.hotelShortlist : [],
  };
}
