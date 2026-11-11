import type { EventThemeId } from "@/theme/event-theme";

// Annual dates belong to the edition; visual themes remain reusable each year.
export const EVENT_EDITIONS = {
  "tour-de-france": {
    name: "Tour de France Amateur",
    location: "Valdivia",
    dateLabel: "26 de octubre – 1 de noviembre de 2026",
    shortDateLabel: "26 oct – 1 nov 2026",
    startDate: "2026-10-26",
    endDate: "2026-11-01",
  },
  "ironman-valdivia": {
    name: "IRONMAN Valdivia",
    location: "Valdivia",
    dateLabel: "29 de noviembre de 2026",
    shortDateLabel: "29 nov 2026",
    startDate: "2026-11-29",
    endDate: "2026-11-29",
  },
} as const satisfies Record<EventThemeId, {
  name: string;
  location: string;
  dateLabel: string;
  shortDateLabel: string;
  startDate: string;
  endDate: string;
}>;
