"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, InputAdornment, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { getAdminRequestsPageState } from "@/features/admin/assignment/queries";
import { RelocationCandidates } from "./relocation-candidates";
import { EmptyState } from "./master-data-cards";
import { filterInboxShifts, type InboxFocus } from "@/features/admin/assignment/inbox-utils";

type Props = {
  shifts: Awaited<ReturnType<typeof getAdminRequestsPageState>>["shifts"];
};

export function RequestsInbox({ shifts }: Props) {
  const [search, setSearch] = useState("");
  const [day, setDay] = useState("");
  const [focus, setFocus] = useState<InboxFocus>("all");
  const [expanded, setExpanded] = useState<string | false>(false);
  const days = [...new Map(shifts.map((shift) => [shift.dateKey, shift.dateLabel])).entries()];
  const visible = useMemo(() => filterInboxShifts(shifts, { search, day, focus }), [shifts, search, day, focus]);
  const groups = new Map<string, typeof visible>();
  for (const shift of visible) {
    const group = groups.get(shift.dateKey) ?? [];
    group.push(shift);
    groups.set(shift.dateKey, group);
  }
  const options: { value: InboxFocus; label: string; count: number }[] = [
    { value: "all", label: "Todos", count: shifts.length },
    { value: "single", label: "Un solo solicitante", count: shifts.filter((shift) => !shift.currentAssignmentLabel && shift.pendingCount === 1).length },
    { value: "alternatives", label: "Con candidatos en otros lugares", count: shifts.filter((shift) => shift.relocationCandidates.length > 0).length },
    { value: "multiple", label: "2 o más solicitantes", count: shifts.filter((shift) => !shift.currentAssignmentLabel && shift.pendingCount >= 2).length },
  ];
  function reset() { setSearch(""); setDay(""); setFocus("all"); }

  return (
    <Stack spacing={2.5}>
      <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField label="Buscar persona o lugar" value={search} onChange={(event) => setSearch(event.target.value)} size="small" fullWidth
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} />
            <TextField select label="Día" value={day} onChange={(event) => setDay(event.target.value)} size="small" sx={{ minWidth: { sm: 230 } }}>
              <MenuItem value="">Todos los días</MenuItem>
              {days.map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap" }} aria-label="Priorizar solicitudes">
            {options.map((option) => <Chip key={option.value} label={`${option.label} · ${option.count}`} variant={focus === option.value ? "filled" : "outlined"}
              onClick={() => setFocus(option.value)} aria-pressed={focus === option.value} />)}
          </Stack>
        </Stack>
      </Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" color="text.secondary" role="status">{visible.length} de {shifts.length} turnos · Abre un turno para comparar personas.</Typography>
        {search || day || focus !== "all" ? <Button size="small" onClick={reset}>Limpiar búsqueda</Button> : null}
      </Stack>
      {visible.length === 0 ? <EmptyState title="Sin coincidencias" body="Prueba con otra persona, día o filtro de prioridad." /> : null}
      {[...groups.entries()].map(([dateKey, dayShifts]) => (
        <Stack key={dateKey} spacing={1} component="section" aria-label={dayShifts[0].dateLabel}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", py: 0.5 }}>
            <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>{dayShifts[0].dateLabel}</Typography>
            <Typography variant="body2" color="text.secondary">{dayShifts.length} {dayShifts.length === 1 ? "turno" : "turnos"}</Typography>
          </Stack>
          {dayShifts.map((shift) => (
            <Box key={shift.id} sx={{ border: "1px solid", borderColor: expanded === shift.id ? "text.primary" : "divider", bgcolor: "background.paper" }}>
              <Accordion expanded={expanded === shift.id} onChange={(_, open) => setExpanded(open ? shift.id : false)} disableGutters elevation={0}
                sx={{ border: 0, boxShadow: "none", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} id={`summary-${shift.id}`} aria-controls={`details-${shift.id}`} sx={{ px: 2, "& .MuiAccordionSummary-content": { my: 1.5, minWidth: 0 } }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "140px 1fr auto" }, gap: { xs: 1, md: 2 }, width: "100%", alignItems: "center", pr: 1 }}>
                    <Typography sx={{ fontWeight: 700 }}>{shift.timeLabel}</Typography>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700 }}>{shift.zoneName}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                        {shift.currentAssignmentLabel ?? (shift.requesters.map((person) => person.name).join(" · ") || "Sin solicitantes")}
                      </Typography>
                    </Box>
                    <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: "wrap" }}>
                      <Chip size="small" color={shift.currentAssignmentLabel ? "success" : shift.pendingCount < 2 ? "warning" : "default"}
                        label={shift.currentAssignmentLabel ? "Asignado" : `${shift.pendingCount} ${shift.pendingCount === 1 ? "solicitante" : "solicitantes"}`} />
                      {shift.relocationCandidates.length > 0 ? <Chip size="small" color="info" variant="outlined" label={`${shift.relocationCandidates.length} en otros lugares`} /> : null}
                    </Stack>
                  </Box>
                </AccordionSummary>
                <AccordionDetails id={`details-${shift.id}`} sx={{ p: { xs: 2, md: 2.5 }, borderTop: "1px solid", borderColor: "divider" }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: shift.relocationCandidates.length ? "1fr 1fr" : "1fr" }, gap: 3 }}>
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Solicitaron este lugar</Typography>
                      {shift.currentAssignmentLabel ? <Typography>Pareja confirmada: {shift.currentAssignmentLabel}</Typography> : null}
                      {shift.requesters.map((person) => <Box key={person.id} sx={{ p: 1.5, bgcolor: "action.hover", borderLeft: "3px solid", borderColor: "text.primary" }}>
                        <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap", alignItems: "center" }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{person.name}</Typography>
                          <Chip size="small" variant="outlined" label={`${person.confirmedAssignmentCount} turnos confirmados`} />
                        </Stack>
                        {person.comments ? <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{person.comments}</Typography> : null}
                        {person.participantNotes ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Observaciones: {person.participantNotes}</Typography> : null}
                      </Box>)}
                      {shift.resolvedCount > 0 ? <Typography variant="body2" color="text.secondary">{shift.resolvedCount} solicitudes resueltas</Typography> : null}
                    </Stack>
                    <RelocationCandidates candidates={shift.relocationCandidates} />
                  </Box>
                </AccordionDetails>
              </Accordion>
              <Stack direction="row" sx={{ px: 2, py: 1, borderTop: "1px solid", borderColor: "divider", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                <Typography variant="caption" color="text.secondary">{shift.currentAssignmentLabel ? "Turno cubierto" : "La pareja se confirma al resolver el turno."}</Typography>
                <Button component={Link} href={`/admin/turnos/${shift.id}`} size="small" variant={shift.currentAssignmentLabel ? "text" : "contained"} endIcon={<ArrowForwardRoundedIcon />} sx={{ flexShrink: 0 }}>
                  {shift.currentAssignmentLabel ? "Ver asignación" : "Resolver turno"}
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      ))}
    </Stack>
  );
}
