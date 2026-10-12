"use client";

import { useActionState, useCallback, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import { saveZoneAction } from "@/features/admin/master-data/actions";
import { getMapColor, MAP_COLORS, parseCoordinatePair, type MapPlace } from "@/lib/places-map";
import { CoordinatePicker } from "@/components/maps/coordinate-picker";

function ZoneForm({ zone, onClose }: { zone?: MapPlace; onClose: () => void }) {
  const [state, action, pending] = useActionState(saveZoneAction, { error: "", success: false });
  const [latitude, setLatitude] = useState(zone?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(zone?.longitude?.toString() ?? "");
  const [pair, setPair] = useState("");
  const [pairError, setPairError] = useState("");
  const [color, setColor] = useState(getMapColor(zone?.mapColor ?? MAP_COLORS[0].value));
  const updateCoordinates = useCallback((lat: string, lng: string) => {
    setLatitude(lat); setLongitude(lng);
  }, []);
  const usePair = () => {
    const parsed = parseCoordinatePair(pair);
    if (!parsed) { setPairError("Pega latitud, longitud. Ej.: -39.8142, -73.2459."); return; }
    setPairError("");
    updateCoordinates(String(parsed.latitude), String(parsed.longitude));
  };

  return (
    <form action={action}>
      <DialogTitle>{zone ? "Editar lugar" : "Nuevo lugar"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {state.error ? <Alert severity="error">{state.error}</Alert> : null}
          {state.success ? <Alert severity="success">Lugar guardado correctamente.</Alert> : null}
          <input type="hidden" name="id" value={zone?.id ?? ""} />
          <TextField name="name" label="Nombre del lugar" defaultValue={zone?.name ?? ""} required fullWidth />
          <TextField name="description" label="Descripción" defaultValue={zone?.description ?? ""} multiline minRows={2} fullWidth />
          <TextField name="address" label="Dirección o referencia de acceso" defaultValue={zone?.address ?? ""} fullWidth />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField name="status" label="Estado" select defaultValue={zone?.status ?? "ACTIVE"}>
              <MenuItem value="ACTIVE">Activo</MenuItem><MenuItem value="INACTIVE">Inactivo</MenuItem>
            </TextField>
            <FormControlLabel control={<Switch name="publicVisible" defaultChecked={zone?.publicVisible ?? true} />} label="Visible públicamente" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ mb: 0.75 }}>Ubicación en el mapa</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Pincha el mapa para ubicar el lugar. Arrastra el pin para ajustar el punto exacto, o ingresa las coordenadas abajo.
            </Typography>
            <CoordinatePicker latitude={latitude} longitude={longitude} onChange={updateCoordinates} />
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField label="Pegar coordenadas" value={pair} onChange={(event) => setPair(event.target.value)}
              placeholder="-39.8142, -73.2459" error={Boolean(pairError)} helperText={pairError || "Formato: latitud, longitud"} fullWidth />
            <Button variant="outlined" onClick={usePair} sx={{ alignSelf: "flex-start", mt: { sm: "7px !important" }, whiteSpace: "nowrap" }}>Ubicar punto</Button>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField name="latitude" label="Latitud" value={latitude} onChange={(event) => setLatitude(event.target.value)}
              type="number" slotProps={{ htmlInput: { min: -90, max: 90, step: "any" } }} fullWidth />
            <TextField name="longitude" label="Longitud" value={longitude} onChange={(event) => setLongitude(event.target.value)}
              type="number" slotProps={{ htmlInput: { min: -180, max: 180, step: "any" } }} fullWidth />
          </Stack>
          <Button variant="text" onClick={() => updateCoordinates("", "")} sx={{ alignSelf: "flex-start" }}>Quitar ubicación</Button>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Color del punto</Typography>
            <input type="hidden" name="mapColor" value={color} />
            <Box role="group" aria-label="Colores pastel del lugar" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", sm: "repeat(5, minmax(0, 1fr))" }, gap: 1 }}>
              {MAP_COLORS.map((option) => (
                <Button key={option.value} aria-label={option.label} aria-pressed={color === option.value}
                  onClick={() => setColor(option.value)} sx={{ minWidth: 0, minHeight: 48, px: 1, py: 1,
                    color: "#111", fontSize: 12, backgroundColor: option.value, border: "2px solid", borderColor: color === option.value ? "#111" : "transparent",
                    outline: color === option.value ? "2px solid #f5ed00" : "none", outlineOffset: 1,
                    "&:hover": { backgroundColor: option.value, borderColor: "#111" }, "&:focus-visible": { outline: "3px solid #f5ed00" } }}>
                  {color === option.value ? "✓ " : ""}{option.label}
                </Button>
              ))}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={pending}>{state.success ? "Cerrar" : "Cancelar"}</Button>
        <Button type="submit" disabled={pending || (!zone && state.success)} sx={{ bgcolor: "#f5ed00", color: "#111", "&:hover": { bgcolor: "#ddd500" } }}>
          {pending ? "Guardando…" : zone ? "Guardar cambios" : "Crear lugar"}
        </Button>
      </DialogActions>
    </form>
  );
}

export function ZoneEditor({ zone }: { zone?: MapPlace }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>{zone ? "Editar lugar y ubicación" : "Agregar lugar"}</Button>
      <Dialog open={open} fullWidth maxWidth="md">
        {open ? <ZoneForm zone={zone} onClose={() => setOpen(false)} /> : null}
      </Dialog>
    </>
  );
}
