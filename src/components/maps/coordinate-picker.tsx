"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Box, useTheme } from "@mui/material";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { hasCoordinates, VALDIVIA_CENTER } from "@/lib/places-map";
import "maplibre-gl/dist/maplibre-gl.css";
import "./places-map.css";
import { loadMapLibre } from "./map-runtime";

type Props = {
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
};

export function CoordinatePicker({ latitude, longitude, onChange }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const placeMarkerRef = useRef<((lng: number, lat: number) => void) | null>(null);
  const current = useRef({ latitude, longitude, onChange });
  const [error, setError] = useState(false);
  const mode = useTheme().palette.mode;

  useEffect(() => {
    current.current = { latitude, longitude, onChange };
    const coordinates = readCoordinates(latitude, longitude);
    if (coordinates) {
      placeMarkerRef.current?.(coordinates.longitude, coordinates.latitude);
      if (!mapRef.current?.getBounds().contains([coordinates.longitude, coordinates.latitude])) {
        mapRef.current?.easeTo({ center: [coordinates.longitude, coordinates.latitude], duration: 0 });
      }
    } else if (!coordinates && markerRef.current) markerRef.current.remove();
  }, [latitude, longitude, onChange]);

  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    let map: MapLibreMap | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    void loadMapLibre().then((lib) => {
      if (disposed || !container.current) return;
      const initial = readCoordinates(current.current.latitude, current.current.longitude);
      try {
        map = new lib.Map({
          container: container.current,
          style: `https://tiles.openfreemap.org/styles/${mode === "dark" ? "dark" : "positron"}`,
          center: initial ? [initial.longitude, initial.latitude] : VALDIVIA_CENTER,
          zoom: initial ? 15 : 12,
          attributionControl: { compact: true },
          cooperativeGestures: true,
        });
      } catch { setError(true); return; }
      mapRef.current = map;
      map.addControl(new lib.NavigationControl({ showCompass: false }), "top-right");
      map.getCanvas().style.cursor = "crosshair";
      observer = new ResizeObserver(() => map?.resize());
      observer.observe(container.current);
      timeout = setTimeout(() => { if (!disposed && !map?.isStyleLoaded()) setError(true); }, 15000);
      const placeMarker = (lng: number, lat: number) => {
        if (!map) return;
        if (!markerRef.current) {
          const element = document.createElement("div");
          element.className = "coordinate-pin";
          element.title = "Arrastra para ajustar la ubicación";
          const marker = new lib.Marker({ element, draggable: true });
          marker.on("dragend", () => {
            const position = marker.getLngLat().wrap();
            current.current.onChange(position.lat.toFixed(6), position.lng.toFixed(6));
          });
          markerRef.current = marker;
        }
        markerRef.current.setLngLat([lng, lat]).addTo(map);
      };
      placeMarkerRef.current = placeMarker;
      if (initial) placeMarker(initial.longitude, initial.latitude);
      map.on("click", (event) => {
        const { lng, lat } = event.lngLat.wrap();
        placeMarker(lng, lat);
        current.current.onChange(lat.toFixed(6), lng.toFixed(6));
      });
      map.on("load", () => { clearTimeout(timeout); if (!disposed) setError(false); });
      map.on("error", () => { if (!disposed) setError(true); });
    }).catch(() => { if (!disposed) setError(true); });
    return () => {
      disposed = true;
      clearTimeout(timeout);
      observer?.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      placeMarkerRef.current = null;
      map?.remove();
      mapRef.current = null;
    };
  }, [mode]);

  return (
    <Box className="places-map-canvas" sx={{ position: "relative", border: "1px solid", borderColor: "divider", height: 300 }}>
      <Box ref={container} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-label="Mapa para ubicar el lugar" />
      {error ? <Alert severity="warning" sx={{ position: "absolute", left: 8, right: 48, top: 8 }}>No se pudo cargar el mapa. Puedes ingresar las coordenadas en los campos.</Alert> : null}
    </Box>
  );
}

function readCoordinates(latitude: string, longitude: string) {
  if (!latitude.trim() || !longitude.trim()) return null;
  const coordinates = { latitude: Number(latitude), longitude: Number(longitude) };
  return hasCoordinates(coordinates) ? coordinates : null;
}
