import { ACTIVE_EVENT_THEME } from "@/theme/event-theme";
import { EVENT_EDITIONS } from "@/lib/event-editions";

export const EVENT = EVENT_EDITIONS[ACTIVE_EVENT_THEME];
export const EVENT_BRAND_SUBTITLE = `${EVENT.location} · ${EVENT.shortDateLabel}`;

export function getEventDateRange() {
  return {
    from: new Date(`${EVENT.startDate}T00:00:00.000Z`),
    to: new Date(`${EVENT.endDate}T00:00:00.000Z`),
  };
}

export function clampToEventDateRange(from?: Date | null, to?: Date | null) {
  const eventRange = getEventDateRange();
  const boundedFrom = from && from > eventRange.from ? from : eventRange.from;
  const boundedTo = to && to < eventRange.to ? to : eventRange.to;

  return boundedFrom <= boundedTo
    ? { from: boundedFrom, to: boundedTo }
    : eventRange;
}

export function hasEventEnded(now = new Date()) {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => dateParts.find((item) => item.type === type)?.value ?? "";
  const todayInValdivia = `${part("year")}-${part("month")}-${part("day")}`;

  return todayInValdivia > EVENT.endDate;
}
