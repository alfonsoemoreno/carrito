export const MAP_COLORS = [
  { value: "#2563eb", label: "Azul" },
  { value: "#0f766e", label: "Verde" },
  { value: "#9333ea", label: "Violeta" },
  { value: "#c2410c", label: "Naranja" },
  { value: "#be123c", label: "Rosa" },
  { value: "#475569", label: "Gris" },
] as const;

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
