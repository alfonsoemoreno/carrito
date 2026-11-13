import { z } from "zod";
import { blockAppliesToShift } from "@/lib/shift-blocks";

export const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const date = z.string().date();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ingresa una hora válida.");
const slot = z.object({ days: z.array(z.number().int().min(0).max(6)).min(1).max(7), startTime: time, endTime: time })
  .refine((v) => v.startTime < v.endTime, "La hora de término debe ser posterior al inicio.");
const range = { from: date, to: date };
export const scheduleOperationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("schedule"), ...range, slots: z.array(slot).min(1).max(20) }),
  z.object({ kind: z.literal("generate"), ...range }),
  z.object({ kind: z.literal("editSchedule"), templateId: z.string().uuid(), from: date, startTime: time, endTime: time }),
  z.object({ kind: z.literal("toggle"), templateId: z.string().uuid(), active: z.boolean() }),
  z.object({ kind: z.literal("single"), shiftId: z.string().uuid().optional(), date, startTime: time, endTime: time }),
  z.object({ kind: z.literal("block"), ...range, shiftId: z.string().uuid().optional(), reason: z.string().trim().min(4).max(300) }),
  z.object({ kind: z.literal("unblock"), blockId: z.string().uuid() }),
  z.object({ kind: z.literal("reactivate"), shiftId: z.string().uuid() }),
]).superRefine((v, ctx) => {
  if ("from" in v && "to" in v && (v.to < v.from || dayDistance(v.from, v.to) > 366)) {
    ctx.addIssue({ code: "custom", message: "Elige un rango ordenado de hasta un año." });
  }
  if ("startTime" in v && v.startTime >= v.endTime) {
    ctx.addIssue({ code: "custom", message: "La hora de término debe ser posterior al inicio." });
  }
});
export type ScheduleOperation = z.infer<typeof scheduleOperationSchema>;
export type ScheduleTemplate = {
  id: string; dayOfWeek: number; startTime: string; endTime: string;
  status: "ACTIVE" | "INACTIVE"; validFrom: string; validTo: string | null;
};
export type ScheduledShift = {
  id: string; templateId: string | null; date: string; startTime: string; endTime: string;
  status: "OPEN" | "FULL" | "BLOCKED" | "CLOSED"; generated: boolean;
  requests: number; assignments: number; activeRequests: number; confirmedAssignments: number;
};
export type ScheduleBlock = { id: string; shiftId: string | null; from: string; to: string; reason: string; excludedShiftIds?: string[] };
export type ScheduleSnapshot = {
  zoneId: string; active: boolean; templates: ScheduleTemplate[]; shifts: ScheduledShift[]; blocks: ScheduleBlock[];
};
export type SchedulePlan = {
  title: string; existing: number; conflicts: { message: string; shiftId?: string }[]; dates: string[];
  templateCreates: ScheduleTemplate[]; templateUpdates: ScheduleTemplate[];
  shiftCreates: ScheduledShift[]; shiftUpdates: ScheduledShift[];
  blockCreates: ScheduleBlock[]; blockUpdates: ScheduleBlock[]; blockDeletes: string[];
};
export function addDays(value: string, days: number) {
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function dayDistance(from: string, to: string) {
  return (Date.parse(to) - Date.parse(from)) / 86400000;
}
export function overlaps(a: { startTime: string; endTime: string }, b: { startTime: string; endTime: string }) {
  return a.startTime < b.endTime && b.startTime < a.endTime;
}
export function templateDates(t: ScheduleTemplate, from: string, to: string) {
  const dates: string[] = [];
  const end = t.validTo && t.validTo < to ? t.validTo : to;
  for (let d = from > t.validFrom ? from : t.validFrom; d <= end; d = addDays(d, 1)) {
    if (new Date(`${d}T00:00:00Z`).getUTCDay() === t.dayOfWeek) dates.push(d);
  }
  return dates;
}
export function templatesOverlap(a: ScheduleTemplate, b: ScheduleTemplate, today: string) {
  if (a.status !== "ACTIVE" || b.status !== "ACTIVE" || a.dayOfWeek !== b.dayOfWeek || !overlaps(a, b)) return false;
  const from = [today, a.validFrom, b.validFrom].sort().at(-1)!;
  const to = [a.validTo ?? "9999-12-31", b.validTo ?? "9999-12-31"].sort()[0];
  // One matching weekday suffices; do not enumerate an unbounded period.
  return templateDates(a, from, to < addDays(from, 6) ? to : addDays(from, 6)).length > 0;
}
export function shiftStatus(shift: ScheduledShift, blocks: ScheduleBlock[], today: string): ScheduledShift["status"] {
  if (shift.date < today) return "CLOSED";
  if (shift.confirmedAssignments) return "FULL";
  return blocks.some((b) => scheduleBlockApplies(b, shift)) ? "BLOCKED" : "OPEN";
}

export function scheduleBlockApplies(block: ScheduleBlock, shift: Pick<ScheduledShift, "id" | "date">) {
  return (!block.shiftId || block.shiftId === shift.id) && blockAppliesToShift(shift.id, shift.date, { startDate: block.from, endDate: block.to, excludedShiftIds: block.excludedShiftIds });
}

// Pure planning is shared by review and commit. No data changes occur on a conflicting plan.
export function planSchedule(snapshot: ScheduleSnapshot, op: ScheduleOperation, today: string): SchedulePlan {
  const plan: SchedulePlan = { title: "Revisar cambios", existing: 0, conflicts: [], dates: [], templateCreates: [], templateUpdates: [], shiftCreates: [], shiftUpdates: [], blockCreates: [], blockUpdates: [], blockDeletes: [] };
  const conflict = (message: string, shiftId?: string) => plan.conflicts.push({ message, shiftId });
  const templates = snapshot.templates.map((t) => ({ ...t }));
  const shifts = snapshot.shifts.map((s) => ({ ...s }));
  if ("from" in op && op.from < today || "date" in op && op.date < today) conflict("Solo puedes modificar fechas desde hoy en adelante.");
  if (!snapshot.active && (["schedule", "generate", "single", "editSchedule"].includes(op.kind) || op.kind === "toggle" && op.active)) conflict("Activa el lugar antes de crear o cambiar sus turnos.");
  function checkTemplate(t: ScheduleTemplate, ignoreId?: string) {
    if (templates.some((other) => other.id !== ignoreId && other.id !== t.id && other.dayOfWeek === t.dayOfWeek && other.startTime === t.startTime && other.endTime === t.endTime && other.validFrom === t.validFrom)) {
      conflict(`${DAY_NAMES[t.dayOfWeek]} ${t.startTime}–${t.endTime}: ya existe un horario con ese inicio de vigencia. Reanúdalo o elige otro período.`);
      return;
    }
    if (templates.some((other) => other.id !== ignoreId && other.id !== t.id && templatesOverlap(t, other, today))) {
      conflict(`${DAY_NAMES[t.dayOfWeek]} ${t.startTime}–${t.endTime}: se cruza con otro horario habitual.`);
    }
  }
  function checkShift(s: ScheduledShift, checkRecurring = false) {
    const other = shifts.find((o) => o.id !== s.id && o.date === s.date && overlaps(s, o));
    if (other) conflict(`${s.date} ${s.startTime}–${s.endTime}: se cruza con un turno existente.`, other.id);
    if (checkRecurring && templates.some((t) => t.id !== s.templateId && t.status === "ACTIVE" && templateDates(t, s.date, s.date).length && overlaps(s, t))) {
      conflict(`${s.date}: el horario se cruza con un horario habitual. Revisa o genera sus turnos primero.`);
    }
  }
  function generate(selected: ScheduleTemplate[], from: string, to: string) {
    for (const t of selected.filter((t) => t.status === "ACTIVE")) {
      for (const d of templateDates(t, from, to)) {
        // A manually edited occurrence still owns its original template/date.
        if (shifts.some((s) => s.date === d && (s.templateId === t.id || s.startTime === t.startTime && s.endTime === t.endTime))) { plan.existing++; continue; }
        const s: ScheduledShift = { id: `new-shift-${plan.shiftCreates.length}`, templateId: t.id, date: d, startTime: t.startTime, endTime: t.endTime, status: "OPEN", generated: true, requests: 0, assignments: 0, activeRequests: 0, confirmedAssignments: 0 };
        s.status = shiftStatus(s, snapshot.blocks, today);
        checkShift(s);
        plan.shiftCreates.push(s); shifts.push(s); plan.dates.push(d);
      }
    }
  }
  if (op.kind === "schedule") {
    plan.title = "Crear horarios y turnos";
    for (const slot of op.slots) for (const dayOfWeek of new Set(slot.days)) {
      const t: ScheduleTemplate = { id: `new-template-${plan.templateCreates.length}`, dayOfWeek, startTime: slot.startTime, endTime: slot.endTime, status: "ACTIVE", validFrom: op.from, validTo: op.to };
      if (!templateDates(t, op.from, op.to).length) { conflict(`El período no incluye ningún ${DAY_NAMES[dayOfWeek].toLowerCase()}.`); continue; }
      checkTemplate(t); plan.templateCreates.push(t); templates.push(t);
    }
    generate(plan.templateCreates, op.from, op.to);
  } else if (op.kind === "generate") {
    plan.title = "Crear turnos faltantes";
    generate(templates, op.from, op.to);
  } else if (op.kind === "editSchedule") {
    plan.title = "Cambiar este horario desde una fecha";
    const old = templates.find((t) => t.id === op.templateId);
    if (!old) conflict("El horario ya no existe.");
    else if (old.status !== "ACTIVE" || op.from < old.validFrom || old.validTo && op.from > old.validTo) conflict("Elige una fecha dentro de la vigencia de un horario activo.");
    else if (old.startTime === op.startTime && old.endTime === op.endTime) conflict("El horario no tiene cambios.");
    else {
      const next: ScheduleTemplate = { ...old, id: old.validFrom === op.from ? old.id : "new-template-0", startTime: op.startTime, endTime: op.endTime, validFrom: op.from };
      checkTemplate(next, old.id);
      if (old.validFrom === op.from) {
        Object.assign(old, next); plan.templateUpdates.push({ ...next });
      } else {
        old.validTo = addDays(op.from, -1); plan.templateUpdates.push({ ...old });
        plan.templateCreates.push(next); templates.push(next);
      }
      const affected = shifts.filter((s) => s.templateId === old.id && s.date >= op.from);
      for (const s of affected) {
        if (s.generated && (s.activeRequests || s.confirmedAssignments)) { conflict(`${s.date}: resuelve sus solicitudes o asignaciones antes de cambiar el horario.`, s.id); continue; }
        s.templateId = next.id;
        // Preserve deliberate single-date exceptions, including their original times.
        if (s.generated) { s.startTime = next.startTime; s.endTime = next.endTime; }
        checkShift(s);
        plan.shiftUpdates.push({ ...s }); plan.dates.push(s.date);
      }
      generate([next], op.from, next.validTo && next.validTo < addDays(today, 56) ? next.validTo : addDays(today, 56));
    }
  } else if (op.kind === "toggle") {
    plan.title = op.active ? "Reanudar horario habitual" : "Pausar creación de turnos";
    const t = templates.find((t) => t.id === op.templateId);
    if (!t) conflict("El horario ya no existe.");
    else {
      if (op.active && t.validTo && t.validTo < today) conflict("Este horario terminó. Crea uno nuevo con el período que necesitas.");
      t.status = op.active ? "ACTIVE" : "INACTIVE";
      if (op.active) { checkTemplate(t); generate([t], today, addDays(today, 56)); }
      plan.templateUpdates.push(t);
    }
  } else if (op.kind === "single") {
    plan.title = op.shiftId ? "Cambiar solo este turno" : "Agregar turno puntual";
    const old = op.shiftId ? shifts.find((s) => s.id === op.shiftId) : undefined;
    if (op.shiftId && !old) conflict("El turno ya no existe.");
    else if (old && (old.date < today || old.activeRequests || old.confirmedAssignments)) conflict("Este turno tiene solicitudes, asignaciones o es pasado. Revisa su detalle antes de cambiarlo.", old.id);
    else if (old && op.date !== old.date) conflict("Para conservar sus excepciones, cambia el horario del turno sin cambiar su fecha.", old.id);
    else {
      const s: ScheduledShift = { id: old?.id ?? "new-shift-0", templateId: old?.templateId ?? null, date: op.date, startTime: op.startTime, endTime: op.endTime, generated: false, status: old?.status ?? "OPEN", requests: old?.requests ?? 0, assignments: old?.assignments ?? 0, activeRequests: old?.activeRequests ?? 0, confirmedAssignments: old?.confirmedAssignments ?? 0 };
      s.status = old?.status === "BLOCKED" ? "BLOCKED" : shiftStatus(s, snapshot.blocks, today);
      checkShift(s, true);
      (old ? plan.shiftUpdates : plan.shiftCreates).push(s); plan.dates.push(s.date);
    }
  } else if (op.kind === "block") {
    plan.title = op.shiftId ? "Suspender este turno" : "Suspender fechas del lugar";
    const affected = shifts.filter((s) => (!op.shiftId || s.id === op.shiftId) && s.date >= op.from && s.date <= op.to);
    if (op.shiftId && (affected.length !== 1 || op.from !== affected[0].date || op.to !== affected[0].date)) conflict("Selecciona la fecha exacta del turno que quieres suspender.");
    for (const s of affected) {
      if (s.activeRequests || s.confirmedAssignments) conflict(`${s.date}: tiene solicitudes pendientes o una asignación confirmada. Resuélvelas en su detalle antes de suspender.`, s.id);
      plan.shiftUpdates.push({ ...s, status: "BLOCKED" }); plan.dates.push(s.date);
    }
    plan.blockCreates.push({ id: "new-block-0", shiftId: op.shiftId ?? null, from: op.from, to: op.to, reason: op.reason });
  } else if (op.kind === "reactivate") {
    plan.title = "Volver a activar este turno";
    const shift = shifts.find((s) => s.id === op.shiftId);
    if (!shift) conflict("El turno ya no existe.");
    else if (shift.date < today) conflict("No puedes reactivar un turno pasado.", shift.id);
    else if (!snapshot.active) conflict("Activa el lugar antes de reactivar sus turnos.", shift.id);
    else {
      const remaining = snapshot.blocks.map((b) => {
        if (!scheduleBlockApplies(b, shift)) return b;
        if (b.shiftId) { plan.blockDeletes.push(b.id); return null; }
        const updated = { ...b, excludedShiftIds: [...new Set([...(b.excludedShiftIds ?? []), shift.id])] };
        plan.blockUpdates.push(updated);
        return updated;
      }).filter((b): b is ScheduleBlock => b !== null);
      plan.shiftUpdates.push({ ...shift, status: shiftStatus(shift, remaining, today) });
      plan.dates.push(shift.date);
    }
  } else {
    plan.title = "Quitar suspensión";
    const block = snapshot.blocks.find((b) => b.id === op.blockId);
    if (!block) conflict("La suspensión ya no existe.");
    else {
      plan.blockDeletes.push(block.id);
      for (const s of shifts.filter((s) => s.date >= today && s.date >= block.from && s.date <= block.to && (!block.shiftId || block.shiftId === s.id))) {
        plan.shiftUpdates.push({ ...s, status: shiftStatus(s, snapshot.blocks.filter((b) => b.id !== block.id), today) }); plan.dates.push(s.date);
      }
    }
  }
  plan.dates = [...new Set(plan.dates)].sort();
  return plan;
}
