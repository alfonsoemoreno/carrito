export const EVENT_THEMES = {
  "tour-de-france": {
    label: "Tour de France",
    category: "Amateur",
    color: "#f5ed00",
    iconDirectory: "/icons/tour-de-france",
  },
  "ironman-valdivia": {
    label: "IRONMAN Valdivia",
    category: "Triatlón",
    color: "#276e8a",
    iconDirectory: "/icons/ironman-valdivia",
  },
} as const;

export type EventThemeId = keyof typeof EVENT_THEMES;

export function resolveEventTheme(value: string | undefined): EventThemeId {
  if (!value) return "ironman-valdivia";
  if (value === "tour-de-france" || value === "ironman-valdivia") return value;
  throw new Error(`Tema de evento desconocido: ${value}. Usa tour-de-france o ironman-valdivia.`);
}

// Shared by the server and browser; changing this setting requires a new build.
export const ACTIVE_EVENT_THEME = resolveEventTheme(process.env.NEXT_PUBLIC_EVENT_THEME);
export const EVENT_BRAND = EVENT_THEMES[ACTIVE_EVENT_THEME];
