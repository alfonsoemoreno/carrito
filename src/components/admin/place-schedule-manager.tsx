"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControlLabel, MenuItem, Stack, Tab, Tabs,
  TextField, Typography,
} from "@mui/material";
import { manageScheduleAction, type ScheduleActionState } from "@/features/admin/scheduling/actions";
import {
  addDays, DAY_NAMES, DAY_ORDER, scheduleBlockApplies, type ScheduleOperation, type ScheduleSnapshot,
  type ScheduleTemplate, type ScheduledShift,
} from "@/features/admin/scheduling/planning";

export type CopySchedule = { id: string; name: string; templates: ScheduleTemplate[] };
type Mode = { kind: "schedule" | "generate" } | { kind: "editSchedule"; template: ScheduleTemplate }
  | { kind: "single"; date: string; shift?: ScheduledShift; suspended?: boolean }
  | { kind: "block"; date: string; shift?: ScheduledShift }
  | { kind: "toggle"; template: ScheduleTemplate } | { kind: "unblock"; blockId: string };
function dateLabel(value: string) {
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function ReviewAction({ operation, zoneId }: { operation: ScheduleOperation; zoneId: string }) {
  const [state, action, pending] = useActionState<ScheduleActionState, FormData>(manageScheduleAction, {});
  const review = state.review;
  return (
    <form action={action} data-suppress-global-feedback="true">
      <input type="hidden" name="zoneId" value={zoneId} />
      <input type="hidden" name="operation" value={JSON.stringify(operation)} />
      <input type="hidden" name="token" value={state.token ?? ""} />
      <Stack spacing={2} sx={{ mt: 2 }} aria-live="polite">
        {state.error && <Alert severity="error">{state.error}</Alert>}
        {state.success && <Alert severity="success">{state.success}</Alert>}
        {review && <>
          <Divider />
          <Typography variant="h6">{review.title}</Typography>
          <Typography>
            {review.created} turnos nuevos · {review.updated} turnos a actualizar · {review.existing} ya existentes
          </Typography>
          {review.schedules > 0 && <Typography variant="body2">{review.schedules} horarios habituales a guardar.</Typography>}
          {review.suspensions > 0 && <Typography variant="body2">La suspensión también se aplicará a los turnos que se generen después dentro de estas fechas.</Typography>}
          {review.reopened > 0 && <Typography variant="body2">Se quita esta suspensión. Las demás suspensiones que coincidan se mantienen.</Typography>}
          {review.dates.length > 0 && <Box component="details">
            <Box component="summary" sx={{ cursor: "pointer" }}>Ver las {review.dates.length} fechas afectadas</Box>
            <Typography variant="body2" sx={{ mt: 1, overflowWrap: "anywhere" }}>{review.dates.map(dateLabel).join(" · ")}</Typography>
          </Box>}
          {review.conflicts.length > 0 && <Alert severity="warning">
            <Typography variant="subtitle2">Hay conflictos que debes resolver:</Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {review.conflicts.map((c, i) => <Box key={i}>{c.message}{c.shiftId && <> <Link href={`/admin/turnos/${c.shiftId}`}>Revisar turno</Link></>}</Box>)}
            </Stack>
          </Alert>}
        </>}
        {!state.success && <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button type="submit" name="intent" value="review" variant={review ? "outlined" : "contained"} disabled={pending}>
            {pending ? "Procesando…" : review ? "Volver a revisar" : "Revisar cambios"}
          </Button>
          {review && review.conflicts.length === 0 && <Button type="submit" name="intent" value="apply" variant="contained" disabled={pending}>Aplicar cambios</Button>}
        </Stack>}
      </Stack>
    </form>
  );
}

function ReactivateShiftButton({ zoneId, shiftId }: { zoneId: string; shiftId: string }) {
  const [state, action, pending] = useActionState<ScheduleActionState, FormData>(manageScheduleAction, {});
  return <form action={action} data-suppress-global-feedback="true">
    <input type="hidden" name="zoneId" value={zoneId} />
    <input type="hidden" name="operation" value={JSON.stringify({ kind: "reactivate", shiftId })} />
    <input type="hidden" name="intent" value="apply" />
    <Button type="submit" variant="outlined" size="small" disabled={pending || Boolean(state.success)}>{pending ? "Activando…" : state.success ? "Turno activado" : "Volver a activar"}</Button>
    {state.error && <Alert severity="error" sx={{ mt: 1 }}>{state.error}</Alert>}
    {state.success && <Typography variant="caption" role="status">Turno activado correctamente.</Typography>}
  </form>;
}

function ScheduleForm({ mode, zoneId, today, copyOptions, onClose }: {
  mode: Mode; zoneId: string; today: string; copyOptions: CopySchedule[]; onClose: () => void;
}) {
  const template = mode.kind === "editSchedule" || mode.kind === "toggle" ? mode.template : undefined;
  const shift = "shift" in mode ? mode.shift : undefined;
  const [from, setFrom] = useState("date" in mode ? mode.date : template && template.validFrom > today ? template.validFrom : today);
  const [to, setTo] = useState("date" in mode ? mode.date : addDays(today, 56));
  const [startTime, setStart] = useState(shift?.startTime ?? template?.startTime ?? "09:00");
  const [endTime, setEnd] = useState(shift?.endTime ?? template?.endTime ?? "11:00");
  const [reason, setReason] = useState("");
  const [copyId, setCopyId] = useState("");
  const [slots, setSlots] = useState([{ days: [1] as number[], startTime: "09:00", endTime: "11:00" }]);
  let operation: ScheduleOperation;
  switch (mode.kind) {
    case "schedule": operation = { kind: "schedule", from, to, slots }; break;
    case "generate": operation = { kind: "generate", from, to }; break;
    case "editSchedule": operation = { kind: "editSchedule", templateId: mode.template.id, from, startTime, endTime }; break;
    case "single": operation = { kind: "single", shiftId: shift?.id, date: from, startTime, endTime }; break;
    case "block": operation = { kind: "block", shiftId: shift?.id, from, to: shift ? from : to, reason }; break;
    case "toggle": operation = { kind: "toggle", templateId: mode.template.id, active: mode.template.status !== "ACTIVE" }; break;
    case "unblock": operation = { kind: "unblock", blockId: mode.blockId }; break;
  }
  const titles = { schedule: "Agregar horarios habituales", generate: "Crear turnos faltantes", editSchedule: "Cambiar horario desde una fecha", single: shift ? "Cambiar solo este turno" : "Agregar turno puntual", block: shift ? "Suspender este turno" : "Suspender fechas del lugar", toggle: template?.status === "ACTIVE" ? "Pausar horario habitual" : "Reanudar horario habitual", unblock: "Quitar suspensión" };
  const rangeMode = ["schedule", "generate"].includes(mode.kind) || mode.kind === "block" && !shift;
  return (
    <>
      <DialogTitle>{titles[mode.kind]}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {mode.kind === "schedule" && <>
            {copyOptions.length > 0 && <TextField select label="Copiar horarios de otro lugar (opcional)" value={copyId} onChange={(e) => {
              setCopyId(e.target.value);
              const source = copyOptions.find((p) => p.id === e.target.value);
              if (source) {
                const grouped = new Map<string, typeof slots[number]>();
                for (const t of source.templates) {
                  const key = `${t.startTime}|${t.endTime}`;
                  const existing = grouped.get(key);
                  if (existing) { if (!existing.days.includes(t.dayOfWeek)) existing.days.push(t.dayOfWeek); }
                  else grouped.set(key, { days: [t.dayOfWeek], startTime: t.startTime, endTime: t.endTime });
                }
                setSlots([...grouped.values()]);
              }
            }}>
              <MenuItem value="">Configurar manualmente</MenuItem>
              {copyOptions.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>}
            {copyId && <Typography variant="body2" color="text.secondary">Se copian días y horas. El período será el que elijas abajo.</Typography>}
            {slots.map((slot, i) => <Box key={i}>
              <Typography variant="subtitle1">Horario {i + 1}</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                {DAY_ORDER.map((day) => <FormControlLabel key={day} label={DAY_NAMES[day]} control={<Checkbox checked={slot.days.includes(day)} onChange={(e) => setSlots(slots.map((s, index) => index !== i ? s : { ...s, days: e.target.checked ? [...s.days, day] : s.days.filter((d) => d !== day) }))} />}/>)}
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField label="Inicio" type="time" value={slot.startTime} onChange={(e) => setSlots(slots.map((s, index) => index === i ? { ...s, startTime: e.target.value } : s))} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
                <TextField label="Término" type="time" value={slot.endTime} onChange={(e) => setSlots(slots.map((s, index) => index === i ? { ...s, endTime: e.target.value } : s))} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
                {slots.length > 1 && <Button onClick={() => setSlots(slots.filter((_, index) => index !== i))}>Quitar horario {i + 1}</Button>}
              </Stack>
            </Box>)}
            <Button variant="outlined" onClick={() => setSlots([...slots, { days: [1], startTime: "11:00", endTime: "13:00" }])} disabled={slots.length >= 20} sx={{ alignSelf: "flex-start" }}>Agregar otro horario</Button>
          </>}
          {mode.kind === "generate" && <Typography>Se crearán los turnos faltantes de los horarios activos de este lugar. Se conservan los turnos existentes y sus excepciones.</Typography>}
          {mode.kind === "editSchedule" && <Alert severity="info">Se aplica a este horario desde la fecha elegida. Los turnos anteriores y las excepciones editadas individualmente se conservan. Si un turno tiene solicitudes o asignaciones, tendrás que resolverlo antes de continuar.</Alert>}
          {mode.kind === "single" && mode.shift && mode.suspended && <Alert severity="info">Puedes cambiar las horas sin reabrir el turno. La suspensión y su motivo se mantienen.</Alert>}
          {!["toggle", "unblock"].includes(mode.kind) && <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label={rangeMode ? "Desde" : mode.kind === "editSchedule" ? "Aplicar desde" : "Fecha"} type="date" value={from} onChange={(e) => setFrom(e.target.value)} disabled={Boolean(shift)} fullWidth slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }} />
            {rangeMode && <TextField label="Hasta (inclusive)" type="date" value={to} onChange={(e) => setTo(e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: from, max: from ? addDays(from, 366) : undefined } }} />}
          </Stack>}
          {(mode.kind === "single" || mode.kind === "editSchedule") && <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Inicio" type="time" value={startTime} onChange={(e) => setStart(e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Término" type="time" value={endTime} onChange={(e) => setEnd(e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
          </Stack>}
          {mode.kind === "editSchedule" && template?.validTo && <Typography variant="body2">Este horario mantiene su fecha de término: {dateLabel(template.validTo)}.</Typography>}
          {mode.kind === "block" && <TextField label="Motivo de la suspensión" value={reason} onChange={(e) => setReason(e.target.value)} multiline minRows={2} required helperText="Por ejemplo: feriado, cierre del lugar o mantenimiento." />}
          {mode.kind === "toggle" && <Alert severity="info">{template?.status === "ACTIVE" ? "Se dejarán de crear nuevos turnos de este horario. Los turnos ya creados seguirán disponibles; para suspenderlos usa «Suspender fechas» en el calendario." : "Se reanudará este horario y se crearán sus turnos faltantes para las próximas ocho semanas, dentro de su período de vigencia."}</Alert>}
          {mode.kind === "unblock" && <Typography>Los turnos volverán a estar disponibles si no tienen otra suspensión vigente y el lugar está activo y visible.</Typography>}
          <ReviewAction key={JSON.stringify(operation)} operation={operation} zoneId={zoneId} />
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cerrar</Button></DialogActions>
    </>
  );
}

export function PlaceScheduleManager({ snapshot, today, week, initialView, copyOptions, assignmentLabels }: {
  snapshot: ScheduleSnapshot; today: string; week: string; initialView: "calendar" | "schedules"; copyOptions: CopySchedule[]; assignmentLabels: Record<string, string>;
}) {
  const [tab, setTab] = useState(initialView === "calendar" ? 1 : 0);
  const [mode, setMode] = useState<Mode | null>(null);
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const schedules = snapshot.templates.filter((t) => !t.validTo || t.validTo >= today);
  const blocks = snapshot.blocks.filter((b) => b.to >= today);
  const base = `/admin/zonas/${snapshot.zoneId}/turnos`;
  return (
    <Stack spacing={3}>
      {!snapshot.active && <Alert severity="warning">Este lugar está inactivo. Puedes revisar sus turnos y suspensiones; actívalo en Lugares para crear o cambiar horarios.</Alert>}
      <Tabs value={tab} onChange={(_, value: number) => setTab(value)} aria-label="Gestión de turnos del lugar" variant="fullWidth">
        <Tab id="place-schedules-tab" aria-controls="place-schedules-panel" label="Horarios habituales" />
        <Tab id="place-calendar-tab" aria-controls="place-calendar-panel" label="Calendario" />
      </Tabs>
      <Stack role="tabpanel" id="place-schedules-panel" aria-labelledby="place-schedules-tab" hidden={tab !== 0} spacing={2} sx={{ display: tab === 0 ? "flex" : "none" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="contained" disabled={!snapshot.active} onClick={() => setMode({ kind: "schedule" })}>Agregar horarios</Button>
          <Button variant="outlined" disabled={!snapshot.active || !schedules.some((t) => t.status === "ACTIVE")} onClick={() => setMode({ kind: "generate" })}>Crear turnos faltantes</Button>
        </Stack>
        <Typography color="text.secondary">Define los días y horas que se repiten. Al guardarlos, también se crean los turnos del período elegido.</Typography>
        {schedules.length === 0 && <Alert severity="info">Este lugar no tiene horarios vigentes. Agrega los días y horarios que necesitas.</Alert>}
        {DAY_ORDER.map((day) => {
          const rows = schedules.filter((t) => t.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
          if (!rows.length) return null;
          return <Card key={day}><CardContent><Stack spacing={2}>
            <Typography variant="h6">{DAY_NAMES[day]}</Typography>
            {rows.map((t) => <Stack key={t.id} direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
              <Box>
                <Typography variant="subtitle1">{t.startTime}–{t.endTime} <Chip size="small" label={t.status === "ACTIVE" ? "Activo" : "Pausado"} color={t.status === "ACTIVE" ? "success" : "default"} /></Typography>
                <Typography variant="body2" color="text.secondary">{t.validFrom === "1970-01-01" ? "Sin fecha de inicio" : `Desde ${dateLabel(t.validFrom)}`} · {t.validTo ? `hasta ${dateLabel(t.validTo)}` : "sin fecha de término"}</Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Button variant="outlined" disabled={!snapshot.active || t.status !== "ACTIVE"} onClick={() => setMode({ kind: "editSchedule", template: t })}>Editar horario</Button>
                <Button disabled={!snapshot.active} onClick={() => setMode({ kind: "toggle", template: t })}>{t.status === "ACTIVE" ? "Pausar" : "Reanudar"}</Button>
              </Stack>
            </Stack>)}
          </Stack></CardContent></Card>;
        })}
      </Stack>
      <Stack role="tabpanel" id="place-calendar-panel" aria-labelledby="place-calendar-tab" hidden={tab !== 1} spacing={2} sx={{ display: tab === 1 ? "flex" : "none" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="contained" disabled={!snapshot.active} onClick={() => setMode({ kind: "single", date: today })}>Agregar turno puntual</Button>
          <Button variant="outlined" onClick={() => setMode({ kind: "block", date: today })}>Suspender fechas</Button>
          <Button variant="outlined" disabled={!snapshot.active} onClick={() => setMode({ kind: "generate" })}>Crear turnos faltantes</Button>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Button component={Link} href={`${base}?week=${addDays(week, -7)}&view=calendar`} aria-label="Semana anterior">← Anterior</Button>
          <Typography sx={{ flex: 1, minWidth: { xs: "100%", sm: 0 }, order: { xs: -1, sm: 0 } }}>{dateLabel(week)} al {dateLabel(addDays(week, 6))}</Typography>
          <Button component={Link} href={`${base}?view=calendar`}>Hoy</Button>
          <Button component={Link} href={`${base}?week=${addDays(week, 7)}&view=calendar`} aria-label="Semana siguiente">Siguiente →</Button>
        </Stack>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(7, minmax(0, 1fr))" }, gap: 1 }}>
          {days.map((date) => <Card key={date} variant="outlined"><CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Stack spacing={1.5}>
              <Box><Typography variant="subtitle2">{DAY_NAMES[new Date(`${date}T00:00:00Z`).getUTCDay()]}</Typography><Typography variant="body2">{dateLabel(date)}</Typography></Box>
              {snapshot.shifts.filter((s) => s.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime)).map((s) => {
                const suspended = snapshot.blocks.filter((b) => scheduleBlockApplies(b, s));
                const isSuspended = suspended.length > 0 || s.status === "BLOCKED";
                const protectedShift = s.activeRequests > 0 || s.confirmedAssignments > 0;
                return <Box key={s.id} sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1 }}>
                  <Typography variant="subtitle2">{s.startTime}–{s.endTime}</Typography>
                  <Typography variant="body2" color={isSuspended ? "warning.main" : "text.secondary"}>{isSuspended ? "Suspendido" : s.confirmedAssignments ? "Asignado" : date < today || s.status === "CLOSED" ? "Cerrado" : "Disponible"}</Typography>
                  {assignmentLabels[s.id] && <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{assignmentLabels[s.id]}</Typography>}
                  {s.activeRequests > 0 && <Typography variant="caption">{s.activeRequests} solicitudes activas</Typography>}
                  {!s.generated && <Typography variant="caption" sx={{ display: "block" }}>{s.templateId ? "Horario excepcional" : "Turno puntual"}</Typography>}
                  {suspended.map((b) => <Typography key={b.id} variant="caption" sx={{ display: "block" }}>{b.reason}</Typography>)}
                  <Stack spacing={0.5} sx={{ mt: 1, alignItems: "flex-start" }}>
                    <Button size="small" component={Link} href={`/admin/turnos/${s.id}`}>Ver detalle</Button>
                    {date >= today && <>
                      <Button size="small" disabled={protectedShift || !snapshot.active} onClick={() => setMode({ kind: "single", date, shift: s, suspended: isSuspended })}>Cambiar hora</Button>
                      {protectedShift && <Typography variant="caption">Revisa sus solicitudes o asignaciones para cambiarlo.</Typography>}
                      {!isSuspended && <Button size="small" disabled={s.activeRequests > 0 || s.confirmedAssignments > 0} onClick={() => setMode({ kind: "block", date, shift: s })}>Suspender</Button>}
                      {isSuspended && snapshot.active && <ReactivateShiftButton zoneId={snapshot.zoneId} shiftId={s.id} />}
                    </>}
                  </Stack>
                </Box>;
              })}
              {date >= today && <Button size="small" variant="outlined" disabled={!snapshot.active} onClick={() => setMode({ kind: "single", date })}>+ Turno</Button>}
            </Stack>
          </CardContent></Card>)}
        </Box>
        <Typography variant="h6">Suspensiones vigentes y próximas</Typography>
        {blocks.length === 0 && <Typography color="text.secondary">No hay suspensiones.</Typography>}
        {blocks.map((b) => <Card key={b.id} variant="outlined"><CardContent><Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
          <Box><Typography>{b.shiftId ? "Un turno" : "Todo el lugar"} · {dateLabel(b.from)} al {dateLabel(b.to)}</Typography><Typography color="text.secondary">{b.reason}</Typography>{Boolean(b.excludedShiftIds?.length) && <Typography variant="caption">{b.excludedShiftIds!.length} turnos reactivados individualmente.</Typography>}</Box>
          <Button variant="outlined" onClick={() => setMode({ kind: "unblock", blockId: b.id })}>Quitar suspensión</Button>
        </Stack></CardContent></Card>)}
      </Stack>
      <Dialog open={Boolean(mode)} onClose={() => setMode(null)} fullWidth maxWidth="md">
        {mode && <ScheduleForm mode={mode} zoneId={snapshot.zoneId} today={today} copyOptions={copyOptions} onClose={() => setMode(null)} />}
      </Dialog>
    </Stack>
  );
}
