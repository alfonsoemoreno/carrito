import { addDaysUtc, parseDateInput, startOfTodayUtc, toDateOnlyString } from "@/features/public/utils";

export function resolveStatsRange(input: {
  from?: string | null | undefined;
  to?: string | null | undefined;
}) {
  const today = startOfTodayUtc();
  const defaultFrom = addDaysUtc(today, -30);
  const defaultTo = addDaysUtc(today, 60);

  const from = parseDateInput(input.from) ?? defaultFrom;
  const to = parseDateInput(input.to) ?? defaultTo;

  return {
    from,
    to,
    fromValue: toDateOnlyString(from),
    toValue: toDateOnlyString(to),
  };
}

export function csvEscape(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  const raw = String(value);
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replaceAll('"', '""')}"`;
  }

  return raw;
}

export function buildCsv(rows: Array<Array<string | number | null | undefined>>) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}
