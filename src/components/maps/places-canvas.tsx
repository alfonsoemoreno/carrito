"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Box, CircularProgress, useTheme } from "@mui/material";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { hasCoordinates, VALDIVIA_CENTER, type MapPlace } from "@/lib/places-map";
import "maplibre-gl/dist/maplibre-gl.css";
import "./places-map.css";
import { loadMapLibre } from "./map-runtime";

type Props = {
  places: MapPlace[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  fitVersion: number;
};

export function PlacesCanvas({ places, selectedId, onSelect, fitVersion }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const current = useRef({ places, selectedId, onSelect });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const mode = useTheme().palette.mode;

  useEffect(() => { current.current = { places, selectedId, onSelect }; }, [places, selectedId, onSelect]);

  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let map: MapLibreMap | undefined;
    const markerStore = markers.current;

    loadMapLibre().then((lib) => {
      if (disposed || !container.current) return;
      setReady(false);
      setError(false);
      map = new lib.Map({
        container: container.current,
        style: `https://tiles.openfreemap.org/styles/${mode === "dark" ? "dark" : "positron"}`,
        center: VALDIVIA_CENTER,
        zoom: 12,
        attributionControl: { compact: true },
        cooperativeGestures: true,
      });
      mapRef.current = map;
      map.addControl(new lib.NavigationControl({ showCompass: false }), "top-right");
      observer = new ResizeObserver(() => map?.resize());
      observer.observe(container.current);
      timeout = setTimeout(() => { if (!disposed && !map?.isStyleLoaded()) setError(true); }, 15000);

      const refreshMarkers = () => {
        if (!map || !map.getSource("places")) return;
        const features = map.querySourceFeatures("places");
        const seen = new Set<string>();
        for (const feature of features) {
          if (feature.geometry.type !== "Point") continue;
          const props = feature.properties;
          const cluster = Boolean(props.cluster);
          const key = cluster ? `cluster-${props.cluster_id}` : `place-${props.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          if (!markerStore.has(key)) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = cluster ? "place-pin place-pin-cluster" : "place-pin";
            if (!cluster) button.style.setProperty("--pin-color", props.color);
            button.textContent = String(cluster ? props.point_count : props.number);
            button.setAttribute("aria-label", cluster ? `Acercar ${props.point_count} lugares` : props.name);
            button.title = cluster ? `${props.point_count} lugares cercanos` : props.name;
            button.addEventListener("click", (event) => {
              event.stopPropagation();
              if (cluster) {
                const source = map?.getSource("places") as GeoJSONSource | undefined;
                void source?.getClusterExpansionZoom(Number(props.cluster_id)).then((zoom) => {
                  if (!disposed) map?.easeTo({ center: feature.geometry.type === "Point" ? feature.geometry.coordinates as [number, number] : VALDIVIA_CENTER, zoom });
                }).catch(() => setError(true));
              } else current.current.onSelect(String(props.id));
            });
            const marker = new lib.Marker({ element: button }).setLngLat(feature.geometry.coordinates as [number, number]).addTo(map);
            markerStore.set(key, marker);
          }
          const button = markerStore.get(key)!.getElement();
          button.dataset.selected = String(!cluster && props.id === current.current.selectedId);
          if (!cluster) button.setAttribute("aria-pressed", button.dataset.selected);
        }
        for (const [key, marker] of markerStore) {
          if (!seen.has(key)) { marker.remove(); markerStore.delete(key); }
        }
      };

      map.on("load", () => {
        if (!map || disposed) return;
        clearTimeout(timeout);
        map.addSource("places", { type: "geojson", data: toGeoJSON(current.current.places), cluster: true, clusterRadius: 48, clusterMaxZoom: 16 });
        // A transparent layer makes the clustered source available at the current zoom.
        map.addLayer({ id: "places-source", type: "circle", source: "places", paint: { "circle-radius": 1, "circle-opacity": 0 } });
        map.on("moveend", refreshMarkers);
        map.on("sourcedata", refreshMarkers);
        map.on("idle", refreshMarkers);
        setReady(true);
        setError(false);
        fitPlaces(map, current.current.places, lib.LngLatBounds);
      });
      map.on("error", () => { if (!disposed) setError(true); });
    }).catch(() => { if (!disposed) setError(true); });

    return () => {
      disposed = true;
      clearTimeout(timeout);
      observer?.disconnect();
      markerStore.forEach((marker) => marker.remove());
      markerStore.clear();
      map?.remove();
      mapRef.current = null;
    };
  }, [mode]);

  useEffect(() => {
    if (!ready) return;
    const source = mapRef.current?.getSource("places") as GeoJSONSource | undefined;
    markers.current.forEach((marker) => marker.remove());
    markers.current.clear();
    source?.setData(toGeoJSON(places));
  }, [places, ready]);

  useEffect(() => {
    if (!ready) return;
    const place = places.find((item) => item.id === selectedId);
    for (const [key, marker] of markers.current) {
      const active = key === `place-${selectedId}`;
      marker.getElement().dataset.selected = String(active);
      if (key.startsWith("place-")) marker.getElement().setAttribute("aria-pressed", String(active));
    }
    if (place && hasCoordinates(place)) {
      mapRef.current?.easeTo({ center: [place.longitude, place.latitude], zoom: 16.8,
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650 });
    }
  }, [selectedId, places, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    void import("maplibre-gl").then((lib) => {
      if (mapRef.current === map) fitPlaces(map, places, lib.LngLatBounds);
    });
  }, [fitVersion, places, ready]);

  return (
    <Box className="places-map-canvas" sx={{ height: "100%", minHeight: 360, position: "relative" }}>
      <Box ref={container} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-label="Mapa interactivo de lugares" />
      {!ready && !error ? <Box role="status" sx={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", bgcolor: "background.default" }}><CircularProgress size={28} aria-label="Cargando mapa" /></Box> : null}
      {error ? <Alert severity="warning" sx={{ position: "absolute", top: 12, left: 12, right: 56, zIndex: 2 }}>No se pudo cargar parte del mapa. Puedes seguir consultando los lugares en el listado o recargar la página.</Alert> : null}
    </Box>
  );
}

function toGeoJSON(places: MapPlace[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return { type: "FeatureCollection", features: places.flatMap((place, index) => hasCoordinates(place) ? [{
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [place.longitude, place.latitude] },
    properties: { id: place.id, name: place.name, color: place.mapColor, number: place.number ?? index + 1 },
  }] : []) };
}

function fitPlaces(map: MapLibreMap, places: MapPlace[], Bounds: typeof import("maplibre-gl").LngLatBounds) {
  const located = places.filter(hasCoordinates);
  if (!located.length) { map.easeTo({ center: VALDIVIA_CENTER, zoom: 12 }); return; }
  const bounds = new Bounds();
  located.forEach((place) => bounds.extend([place.longitude!, place.latitude!]));
  map.fitBounds(bounds, { padding: 70, maxZoom: 15, duration: 0 });
}
