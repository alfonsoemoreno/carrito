export const MAP_COLORS = [
  { value: "#b8d4f5", label: "Azul cielo" },
  { value: "#bce8ed", label: "Turquesa" },
  { value: "#bde5d4", label: "Menta" },
  { value: "#c9ddc1", label: "Salvia" },
  { value: "#dfe9b5", label: "Lima" },
  { value: "#f5e6a9", label: "Amarillo" },
  { value: "#f5d7ad", label: "Albaricoque" },
  { value: "#f5c7b4", label: "Durazno" },
  { value: "#efb9b2", label: "Coral" },
  { value: "#f2c3d5", label: "Rosa" },
  { value: "#e5c3db", label: "Malva" },
  { value: "#d7c6ed", label: "Lila" },
  { value: "#c7c9ed", label: "Lavanda" },
  { value: "#cbdce2", label: "Gris perla" },
  { value: "#e5d6c5", label: "Arena" },
] as const;

const LEGACY_MAP_COLORS: Record<string, string> = {
  "#2563eb": "#b8d4f5", "#0f766e": "#bde5d4", "#9333ea": "#d7c6ed",
  "#c2410c": "#f5c7b4", "#be123c": "#f2c3d5", "#475569": "#cbdce2",
};

export function getMapColor(value: string) {
  return LEGACY_MAP_COLORS[value.toLowerCase()] ?? value;
}

export const VALDIVIA_CENTER: [number, number] = [-73.2459, -39.8142];

export function hasCoordinates(place: { latitude: number | null; longitude: number | null }):
  place is { latitude: number; longitude: number } {
  return place.latitude !== null && place.longitude !== null &&
    Number.isFinite(place.latitude) && Number.isFinite(place.longitude) &&
    Math.abs(place.latitude) <= 90 && Math.abs(place.longitude) <= 180;
}

export function parseCoordinatePair(value: string): { latitude: number; longitude: number } | null {
  const parts = value.trim().split(/\s*[,;]\s*/);
  if (parts.length !== 2 || parts.some((part) => !/^-?\d+(\.\d+)?$/.test(part.trim()))) return null;
  const [latitude, longitude] = parts.map(Number);
  const result = { latitude, longitude };
  return hasCoordinates(result) ? result : null;
}

export function directionsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export type MapPlace = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  mapColor: string;
  status: string;
  publicVisible: boolean;
  number?: number;
};
