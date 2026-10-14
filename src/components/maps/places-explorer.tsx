"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Chip, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import NearMeOutlinedIcon from "@mui/icons-material/NearMeOutlined";
import CenterFocusStrongRoundedIcon from "@mui/icons-material/CenterFocusStrongRounded";
import { directionsUrl, getMapColor, hasCoordinates, type MapPlace } from "@/lib/places-map";
import { PlacesCanvas } from "./places-canvas";
import { ZoneEditor } from "@/components/admin/zone-editor";

export function PlacesExplorer({ places, admin = false }: { places: MapPlace[]; admin?: boolean }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fitVersion, setFitVersion] = useState(0);
  const detailsRef = useRef<HTMLDivElement>(null);
  const selectPlace = useCallback((id: string) => setSelectedId(id), []);
  const visible = useMemo(() => places.filter((place) => {
    const term = query.trim().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    const searchable = `${place.name} ${place.address ?? ""} ${place.description ?? ""}`.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    return searchable.includes(term) &&
      (filter !== "located" || hasCoordinates(place)) &&
      (filter !== "pending" || !hasCoordinates(place)) &&
      (filter !== "hidden" || !place.publicVisible || place.status !== "ACTIVE");
  }), [places, query, filter]);
  const selected = visible.find((place) => place.id === selectedId);
  const locatedCount = visible.filter(hasCoordinates).length;

  useEffect(() => {
    if (selectedId && window.matchMedia("(max-width: 899px)").matches) {
      detailsRef.current?.scrollIntoView({
        block: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    }
  }, [selectedId]);

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {[
            ["all", "Todos"], ["located", "En el mapa"], ["pending", "Ubicación pendiente"],
            ...(admin ? [["hidden", "Ocultos / inactivos"]] : []),
          ].map(([value, label]) => <Chip key={value} label={label} clickable variant={filter === value ? "filled" : "outlined"}
            onClick={() => { setFilter(value); setSelectedId(null); }}
            sx={filter === value ? { bgcolor: "#f5ed00", color: "#111", "&:hover": { bgcolor: "#ddd500" } } : {}} />)}
        </Stack>
        <Button startIcon={<CenterFocusStrongRoundedIcon />} variant="outlined" onClick={() => { setSelectedId(null); setFitVersion((value) => value + 1); }}>
          Ver todos los puntos
        </Button>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "300px minmax(0, 1fr)" }, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Box sx={{ order: { xs: 2, md: 1 }, borderRight: { md: "1px solid" }, borderColor: "divider", minWidth: 0 }}>
          <Box sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
            <TextField label="Buscar lugar" size="small" value={query} onChange={(event) => { setQuery(event.target.value); setSelectedId(null); }} fullWidth
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
              {visible.length} lugares · {locatedCount} puntos en el mapa
            </Typography>
          </Box>
          <Box sx={{ maxHeight: { xs: 320, md: 510 }, overflowY: "auto" }}>
            {visible.length === 0 ? <Box sx={{ p: 2.5 }}><Typography color="text.secondary">No hay lugares que coincidan. Prueba otro nombre o filtro.</Typography></Box> : visible.map((place, index) => (
              <Box key={place.id} component="button" onClick={() => selectPlace(place.id)} aria-pressed={place.id === selected?.id}
                sx={{ display: "flex", gap: 1.5, width: "100%", textAlign: "left", font: "inherit", cursor: "pointer", p: 2.5,
                  color: "text.primary", bgcolor: place.id === selected?.id ? "action.selected" : "transparent", border: 0,
                  borderBottom: "1px solid", borderColor: "divider", "&:hover": { bgcolor: "action.hover" },
                  "&:focus-visible": { outline: "3px solid #f5ed00", outlineOffset: -3 } }}>
                <Box component="span" sx={{ flexShrink: 0, width: 28, height: 28, display: "grid", placeItems: "center", bgcolor: getMapColor(place.mapColor), color: "#111", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{place.number ?? index + 1}</Box>
                <Box component="span" sx={{ minWidth: 0 }}>
                  <Typography component="span" sx={{ display: "block", fontWeight: 700, fontSize: 15 }}>{place.name}</Typography>
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>{place.address || place.description || "Sin dirección de referencia"}</Typography>
                  {!hasCoordinates(place) ? <Typography component="span" variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>Ubicación pendiente</Typography> : null}
                  {admin && (!place.publicVisible || place.status !== "ACTIVE") ? <Typography component="span" variant="caption" sx={{ display: "block", mt: 0.5 }}>{!place.publicVisible ? "Oculto" : "Visible"} · {place.status === "ACTIVE" ? "Activo" : "Inactivo"}</Typography> : null}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ order: { xs: 1, md: 2 }, minWidth: 0, position: "relative", bgcolor: "background.default" }}>
          <Box sx={{ height: { xs: 420, md: 600 } }}>
            <PlacesCanvas places={visible} selectedId={selected?.id ?? null} onSelect={selectPlace} fitVersion={fitVersion} />
          </Box>
          {!selected ? <Box sx={{ position: "absolute", top: 16, left: 16, right: 64, pointerEvents: "none" }}>
            <Typography sx={{ display: "inline-block", px: 1.5, py: 1, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", fontSize: 12, boxShadow: "0 2px 12px #00000010" }}>
              {locatedCount ? "Selecciona un punto para descubrir el lugar" : "Los lugares con coordenadas aparecerán aquí"}
            </Typography>
          </Box> : null}
          {selected ? (
            <Box ref={detailsRef} role="region" aria-label={`Detalle de ${selected.name}`} aria-live="polite"
              sx={{ position: { xs: "relative", md: "absolute" }, bottom: { md: 24 }, left: { md: 24 }, width: { md: "min(380px, calc(100% - 80px))" },
                bgcolor: "background.paper", border: "1px solid", borderColor: "divider", boxShadow: "0 8px 32px #11111118", borderTop: "4px solid #f5ed00", scrollMarginTop: "96px", p: 2.5 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }} spacing={1}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">Tu punto de encuentro</Typography>
                    <Typography variant="h5">{selected.name}</Typography>
                  </Box>
                  <IconButton aria-label="Cerrar detalle" size="small" onClick={() => setSelectedId(null)}><CloseRoundedIcon fontSize="small" /></IconButton>
                </Stack>
                {selected.description ? <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line", maxHeight: 100, overflowY: "auto" }}>{selected.description}</Typography> : null}
                {selected.address ? <Typography variant="body2">{selected.address}</Typography> : !selected.description ? <Typography variant="body2">Sin dirección de referencia</Typography> : null}
                {hasCoordinates(selected) ? (
                  <Button component="a" href={directionsUrl(selected.latitude, selected.longitude)} target="_blank" rel="noopener noreferrer"
                    startIcon={<NearMeOutlinedIcon />} sx={{ bgcolor: "#f5ed00", color: "#111", "&:hover": { bgcolor: "#ddd500" } }}>Cómo llegar</Button>
                ) : <Alert severity="info">Ubicación pendiente de agregar.</Alert>}
                {selected.status === "ACTIVE" && selected.publicVisible ?
                  <Button component="a" href={`/solicitar?zoneId=${selected.id}`} variant="outlined" fullWidth>Ver y solicitar turnos</Button> : null}
                {admin ? <ZoneEditor zone={selected} /> : null}
              </Stack>
            </Box>
          ) : null}
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Cada número identifica un lugar. Los grupos amarillos reúnen puntos cercanos: púlsalos para acercarte.
      </Typography>
    </Stack>
  );
}
