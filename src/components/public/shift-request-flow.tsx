"use client";

import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
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
type Shift = {
  id: string;
  zoneId: string;
  zoneName: string;
  dateLabel: string;
  fullDateLabel: string;
  startLabel: string;
  endLabel: string;
  status: string;
  ownLatestRequest: { status: string } | null;
  publicAssignments: Array<{ id: string; label: string }>;
};

type ShiftRequestFlowProps = {
  zones: Zone[];
  shifts: Shift[];
  initialZoneId: string;
  from: string;
  to: string;
  maintenanceModeEnabled: boolean;
  requestError: string;
};

export function ShiftRequestFlow({
  zones,
  shifts,
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
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
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
  const shiftsByDate = useMemo(() => {
    const groups = new Map<string, Shift[]>();

    for (const shift of availableShifts) {
      const group = groups.get(shift.dateLabel) ?? [];
      group.push(shift);
      groups.set(shift.dateLabel, group);
    }

    return Array.from(groups, ([dateLabel, dateShifts]) => ({ dateLabel, shifts: dateShifts }));
  }, [availableShifts]);

  const selectZone = (nextZoneId: string) => {
    setZoneId(nextZoneId);
    setSelectedShiftIds([]);
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
        <Card elevation={0} sx={{ borderRadius: 0, border: "1px solid", borderColor: "divider" }}>
          <CardContent>
            <Stack spacing={{ xs: 2.5, md: 3 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <EventAvailableRoundedIcon color="primary" />
                <Typography variant="h5">1. Elige un lugar</Typography>
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
          <Card elevation={0} sx={{ borderRadius: 0, border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: { xs: 2, md: 3, lg: 4 }, "&:last-child": { pb: { xs: 2, md: 3, lg: 4 } } }}>
              <Stack spacing={{ xs: 3, md: 3.5 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <EventAvailableRoundedIcon color="primary" />
                  <Typography variant="h5">2. Elige tus horarios</Typography>
                </Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "stretch" } }}>
                  <Box
                    sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1.5,
                    border: "1px solid",
                    borderColor: "primary.main",
                    borderRadius: 0,
                    backgroundColor: "action.selected",
                    flex: 1,
                  }}
                >
                  <PlaceRoundedIcon color="primary" sx={{ fontSize: 30 }} />
                  <Stack spacing={0.25}>
                    <Typography variant="overline" color="primary.main" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
                      Lugar seleccionado
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 750 }}>
                      {selectedZone.name}
                    </Typography>
                  </Stack>
                </Box>
                <Button variant="outlined" onClick={() => setStep("zone")} sx={{ alignSelf: { xs: "stretch", md: "center" }, minHeight: 48, px: 3 }}>
                  Cambiar lugar
                </Button>
                </Stack>
                <input type="hidden" name="returnTo" value={`/solicitar?scheduleView=available&from=${from}&to=${to}&zoneId=${zoneId}`} />
                {availableShifts.length > 0 ? (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Toca los horarios que te sirven. Puedes elegir más de uno.
                    </Typography>
                    <Accordion elevation={0} disableGutters sx={{ border: "1px solid", borderColor: "divider", borderRadius: 0, "&::before": { display: "none" } }}>
                      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                        <Typography variant="body2" color="text.secondary">Agregar un comentario (opcional)</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TextField name="comments" label="Comentario" placeholder="Escribe una observación" fullWidth multiline minRows={2} />
                      </AccordionDetails>
                    </Accordion>
                    <Divider />
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: { xs: 1.5, lg: 2 } }}>
                      {shiftsByDate.map(({ dateLabel, shifts: dateShifts }, index) => {
                        const selectedForDate = dateShifts.filter((shift) => selectedShiftIds.includes(shift.id)).length;

                        return (
                          <Accordion key={dateLabel} defaultExpanded={index === 0} elevation={0} disableGutters sx={{ border: "1px solid", borderColor: "divider", borderRadius: 0, backgroundColor: "var(--app-surface)", "&::before": { display: "none" } }}>
                            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ minHeight: 64, px: 2, "& .MuiAccordionSummary-content": { my: 1.5 } }}>
                <Stack direction={{ xs: "column", lg: "row" }} spacing={{ xs: 0.25, lg: 1 }} sx={{ flex: 1, minWidth: 0, justifyContent: "space-between", pr: 1 }}>
                                <Typography variant="h6" sx={{ fontSize: { xs: "1.15rem", sm: "1.25rem" }, fontWeight: 750 }}>{dateShifts[0].fullDateLabel}</Typography>
                                <Typography variant="body2" color={selectedForDate > 0 ? "primary.main" : "text.secondary"} sx={{ fontWeight: selectedForDate > 0 ? 700 : 400 }}>
                                  {selectedForDate === 0 ? "Sin seleccionar" : `${selectedForDate} ${selectedForDate === 1 ? "seleccionado" : "seleccionados"}`}
                                </Typography>
                              </Stack>
                            </AccordionSummary>
                            <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 1 }}>
                              {dateShifts.map((shift) => {
                                const isSelected = selectedShiftIds.includes(shift.id);

                                return (
                                  <Box
                                    key={shift.id}
                                    component="label"
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: 1,
                                      minHeight: 58,
                                      px: 1.5,
                                      py: 0.75,
                                      border: "1px solid",
                                      borderColor: isSelected ? "primary.main" : "divider",
                                      borderRadius: 0,
                                      backgroundColor: isSelected ? "action.selected" : "background.paper",
                                      cursor: maintenanceModeEnabled ? "default" : "pointer",
                                      transition: "border-color 120ms ease, background-color 120ms ease",
                                      "&:hover": maintenanceModeEnabled ? undefined : { borderColor: "primary.main" },
                                    }}
                                  >
                                    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                        {shift.startLabel} – {shift.endLabel}
                                      </Typography>
                                      {shift.publicAssignments.length > 0 ? (
                                        <Typography variant="caption" color="text.secondary" noWrap>
                                          Ya asignado a {shift.publicAssignments.map((item) => item.label).join(", ")}
                                        </Typography>
                                      ) : (
                                        <Typography variant="caption" color="success.main">Disponible</Typography>
                                      )}
                                    </Stack>
                                    <Checkbox
                                      name="shiftIds"
                                      value={shift.id}
                                      checked={isSelected}
                                      disabled={maintenanceModeEnabled}
                                      onChange={(event) => {
                                        setSelectedShiftIds((current) =>
                                          event.target.checked
                                            ? [...current, shift.id]
                                            : current.filter((id) => id !== shift.id),
                                        );
                                      }}
                                      slotProps={{ input: { "aria-label": `Seleccionar ${dateLabel}, ${shift.startLabel} a ${shift.endLabel}` } }}
                                      sx={{ flexShrink: 0, mr: -0.75 }}
                                    />
                                  </Box>
                                );
                              })}
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        );
                      })}
                    </Box>
                    <Box sx={{ position: "sticky", bottom: 0, zIndex: 2, pt: 1.5, pb: { xs: 1, sm: 1.5 }, backgroundColor: "background.paper", borderTop: "1px solid", borderColor: "divider", mx: -2, px: 2 }}>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: { xs: "center", sm: "left" } }}>
                          {selectedShiftIds.length === 0
                            ? "Selecciona al menos un horario"
                            : `${selectedShiftIds.length} ${selectedShiftIds.length === 1 ? "horario seleccionado" : "horarios seleccionados"}`}
                        </Typography>
                        <ActionSubmitButton
                          variant="contained"
                          size="large"
                          fullWidth={false}
                          sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { sm: 220 } }}
                          disabled={maintenanceModeEnabled || selectedShiftIds.length === 0}
                          loadingMessage="Estamos enviando tu solicitud de turnos."
                        >
                          Enviar solicitud
                        </ActionSubmitButton>
                      </Stack>
                    </Box>
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
