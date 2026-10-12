"use client";

export async function loadMapLibre() {
  const lib = await import("maplibre-gl");
  // MapLibre 6 ships its worker separately. Let Next emit it as a same-origin asset.
  lib.setWorkerUrl(new URL("../../../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);
  return lib;
}
