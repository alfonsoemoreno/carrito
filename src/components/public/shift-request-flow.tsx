"use client";

import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { ActionSubmitButton } from "@/components/feedback/action-submit-button";
import { submitShiftRequestsAction } from "@/features/public/actions";

type Zone = { id: string; name: string };
type Partner = { id: string; label: string };
type Shift = {
  id: string;
  zoneId: string;
  zoneName: string;
  dateLabel: string;
  startLabel: string;
  endLabel: string;
  status: string;
  ownLatestRequest: { status: string } | null;
  publicAssignments: Array<{ id: string; label: string }>;
};

type ShiftRequestFlowProps = {
  zones: Zone[];
  shifts: Shift[];
  partners: Partner[];
  initialZoneId: string;
  from: string;
  to: string;
  maintenanceModeEnabled: boolean;
  requestError: string;
};

export function ShiftRequestFlow({
  zones,
  shifts,
  partners,
  initialZoneId,
  from,
  to,
  maintenanceModeEnabled,
  requestError,
}: ShiftRequestFlowProps) {
  const [zoneId, setZoneId] = useState(initialZoneId);
  const [step, setStep] = useState<"zone" | "requests">(
    initialZoneId ? "requests" : "zone",
  );
  const selectedZone = zones.find((zone) => zone.id === zoneId);
  const availableShifts = useMemo(
    () => shifts.filter((shift) =>
      shift.zoneId === zoneId &&
      shift.status === "OPEN" &&
      shift.ownLatestRequest?.status !== "PENDING" &&
      shift.ownLatestRequest?.status !== "CONFIRMED",
    ),
    [shifts, zoneId],
  );

  const selectZone = (nextZoneId: string) => {
    setZoneId(nextZoneId);
    const params = new URLSearchParams({
      scheduleView: "available",
      from,
      to,
    });
    if (nextZoneId) {
      params.set("zoneId", nextZoneId);
    }
    window.history.replaceState(null, "", `/solicitar?${params.toString()}`);
  };

  return (
    <Stack spacing={3}>
      {requestError ? <Alert severity="error">{requestError}</Alert> : null}
      {step === "zone" ? (
        <Card elevation={0} sx={{ borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
          <CardContent>
            <Stack spacing={{ xs: 2.5, md: 3 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <EventAvailableRoundedIcon color="primary" />
                <Typography variant="h5">Elige un lugar</Typography>
              </Stack>
              <FormControl fullWidth>
                <InputLabel id="zone-filter-label">Lugar</InputLabel>
                <Select labelId="zone-filter-label" value={zoneId} label="Lugar" onChange={(event) => selectZone(event.target.value)}>
                  <MenuItem value="">Selecciona un lugar</MenuItem>
                  {zones.map((zone) => <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="contained" size="large" fullWidth disabled={!zoneId} onClick={() => setStep("requests")}>
                Siguiente: ver turnos
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      {step === "requests" && selectedZone ? (
        <form action={submitShiftRequestsAction}>
          <Card elevation={0} sx={{ borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Stack spacing={{ xs: 3, md: 3.5 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <EventAvailableRoundedIcon color="primary" />
                  <Typography variant="h5">Revisa y envía tu solicitud</Typography>
                </Stack>
                <Chip label={selectedZone.name} color="primary" variant="outlined" sx={{ alignSelf: "flex-start" }} />
                <Button variant="outlined" onClick={() => setStep("zone")} sx={{ alignSelf: "flex-start" }}>
                  Cambiar lugar
                </Button>
                <input type="hidden" name="returnTo" value={`/solicitar?scheduleView=available&from=${from}&to=${to}&zoneId=${zoneId}`} />
                {availableShifts.length > 0 ? (
                  <>
                    <TextField name="comments" label="Comentario general" placeholder="Observación opcional para estas solicitudes" fullWidth />
                    <Divider />
                    <Stack spacing={2}>
                      {availableShifts.map((shift) => (
                        <Card key={shift.id} elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", backgroundColor: "var(--app-surface)" }}>
                          <CardContent sx={{ px: { xs: 2.25, md: 2.5 }, py: { xs: 2.25, md: 2.5 }, "&:last-child": { pb: { xs: 2.25, md: 2.5 } } }}>
                            <Stack spacing={1.75}>
                              <Stack direction="row" spacing={1.25} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{shift.dateLabel}</Typography>
                                  <Typography variant="body2" color="text.secondary">{shift.zoneName} · {shift.startLabel} - {shift.endLabel}</Typography>
                                </Box>
                                <Chip label="Abierto" color="success" size="small" />
                              </Stack>
                              {shift.publicAssignments.length > 0 ? <Typography variant="caption" color="text.secondary">Ya tomado por {shift.publicAssignments.map((item) => item.label).join(", ")}</Typography> : null}
                              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" }, gap: 1.5, px: { xs: 1.75, md: 2 }, py: { xs: 1.5, md: 1.75 }, border: "1px solid", borderColor: "var(--app-form-border)", borderRadius: "14px", backgroundColor: "var(--app-form-fill)" }}>
                                <Stack spacing={1.25}>
                                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, minHeight: 32 }}>
                                    <Typography variant="caption" sx={{ color: "var(--app-form-label)", fontWeight: 600 }}>Incluir en esta solicitud</Typography>
                                    <Checkbox name="shiftIds" value={shift.id} disabled={maintenanceModeEnabled} sx={{ flexShrink: 0, ml: 0.5, p: 0.5 }} />
                                  </Box>
                                  {partners.length > 0 ? (
                                    <TextField select name={`suggestedPartnerByShift:${shift.id}`} label="Compañero o compañera opcional" defaultValue="" disabled={maintenanceModeEnabled} helperText="Se aplicará solo si incluyes este turno en la solicitud." fullWidth size="small">
                                      <MenuItem value="">Sin sugerencia</MenuItem>
                                      {partners.map((partner) => <MenuItem key={`${shift.id}-${partner.id}`} value={partner.id}>{partner.label}</MenuItem>)}
                                    </TextField>
                                  ) : null}
                                </Stack>
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                    <ActionSubmitButton variant="contained" size="large" disabled={maintenanceModeEnabled} loadingMessage="Estamos enviando tu solicitud de turnos.">Enviar solicitud</ActionSubmitButton>
                  </>
                ) : <Alert severity="warning">No hay turnos disponibles para este lugar en el rango activo. Elige otro lugar para seguir.</Alert>}
              </Stack>
            </CardContent>
          </Card>
        </form>
      ) : null}
    </Stack>
  );
}
