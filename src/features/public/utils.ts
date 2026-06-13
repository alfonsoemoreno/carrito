const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateOnlyString(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function parseDateInput(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function addDaysUtc(value: Date, days: number) {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function startOfTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function buildVisibleDateRange(weeks: number) {
  const from = startOfTodayUtc();
  const to = addDaysUtc(from, Math.max(weeks, 1) * 7);

  return { from, to };
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export function formatTime(value: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(value);
}

export function getWeekRangeUtc(value: Date) {
  const day = value.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = addDaysUtc(value, mondayOffset);
  const normalizedStart = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const end = addDaysUtc(normalizedStart, 6);

  return { start: normalizedStart, end };
}

export function getWeekKey(value: Date) {
  return toDateOnlyString(getWeekRangeUtc(value).start);
}

export function isSameUtcDate(a: Date, b: Date) {
  return toDateOnlyString(a) === toDateOnlyString(b);
}

export function isConsecutiveUtcDate(a: Date, b: Date) {
  const diff = Math.abs(
    new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate())).getTime() -
      new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate())).getTime(),
  );

  return diff === DAY_MS;
}

export function overlapsTimeRange(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
) {
  const aStart = startA.getUTCHours() * 60 + startA.getUTCMinutes();
  const aEnd = endA.getUTCHours() * 60 + endA.getUTCMinutes();
  const bStart = startB.getUTCHours() * 60 + startB.getUTCMinutes();
  const bEnd = endB.getUTCHours() * 60 + endB.getUTCMinutes();

  return aStart < bEnd && bStart < aEnd;
}

export function getHistoryCutoffMonths(historyVisibility: string) {
  switch (historyVisibility) {
    case "THREE_MONTHS":
      return 3;
    case "SIX_MONTHS":
      return 6;
    case "ONE_YEAR":
      return 12;
    case "TWO_YEARS":
      return 24;
    case "UNLIMITED":
      return null;
    default:
      return 12;
  }
}

export function getHistoryCutoffDate(historyVisibility: string) {
  const months = getHistoryCutoffMonths(historyVisibility);

  if (months === null) {
    return null;
  }

  const result = new Date();
  result.setUTCMonth(result.getUTCMonth() - months);
  return result;
}

export function readFirstSearchParam(
  value: string | string[] | undefined,
) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}
