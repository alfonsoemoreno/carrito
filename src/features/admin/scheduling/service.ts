import { createHash, randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { formatTime, parseDateOnly, parseTimeOnly } from "@/features/admin/master-data/utils";
import { planSchedule, type ScheduleOperation, type SchedulePlan, type ScheduleSnapshot } from "./planning";

export async function loadScheduleSnapshot(tx: Prisma.TransactionClient, zoneId: string): Promise<ScheduleSnapshot | null> {
  const zone = await tx.zone.findUnique({
    where: { id: zoneId },
    include: {
      templates: { orderBy: { id: "asc" } },
      shifts: { orderBy: { id: "asc" }, include: { requests: { select: { status: true } }, assignments: { select: { status: true } } } },
      blocks: { where: { shiftId: null }, orderBy: { id: "asc" } },
    },
  });
  if (!zone) return null;
  const specificBlocks = await tx.shiftBlock.findMany({ where: { shift: { zoneId } }, orderBy: { id: "asc" } });
  return {
    zoneId, active: zone.status === "ACTIVE",
    templates: zone.templates.map((t) => ({ id: t.id, dayOfWeek: t.dayOfWeek, startTime: formatTime(t.startTime), endTime: formatTime(t.endTime), status: t.status, validFrom: t.validFrom.toISOString().slice(0, 10), validTo: t.validTo?.toISOString().slice(0, 10) ?? null })),
    shifts: zone.shifts.map((s) => ({ id: s.id, templateId: s.templateId, date: s.shiftDate.toISOString().slice(0, 10), startTime: formatTime(s.startTime), endTime: formatTime(s.endTime), status: s.status, generated: s.generated,
      requests: s.requests.length, assignments: s.assignments.length, activeRequests: s.requests.filter((r) => r.status === "PENDING" || r.status === "CONFIRMED").length, confirmedAssignments: s.assignments.filter((a) => a.status === "CONFIRMED").length })),
    blocks: [...zone.blocks, ...specificBlocks].map((b) => ({ id: b.id, shiftId: b.shiftId, from: b.startDate.toISOString().slice(0, 10), to: b.endDate.toISOString().slice(0, 10), reason: b.reason, excludedShiftIds: b.excludedShiftIds })),
  };
}

export function reviewSchedule(snapshot: ScheduleSnapshot, op: ScheduleOperation, today: string) {
  const plan = planSchedule(snapshot, op, today);
  const token = createHash("sha256").update(JSON.stringify({ snapshot, op, today })).digest("hex");
  return { plan, token };
}

export async function persistSchedulePlan(tx: Prisma.TransactionClient, snapshot: ScheduleSnapshot, op: ScheduleOperation, plan: SchedulePlan, adminId?: string) {
  if (plan.conflicts.length) throw new Error("No se puede aplicar un plan con conflictos.");
  const ids = new Map<string, string>();
  const id = (key: string) => ids.get(key) ?? key;
  for (const t of plan.templateUpdates) {
    await tx.shiftTemplate.update({ where: { id: t.id }, data: { dayOfWeek: t.dayOfWeek, startTime: parseTimeOnly(t.startTime), endTime: parseTimeOnly(t.endTime), status: t.status, validFrom: parseDateOnly(t.validFrom), validTo: t.validTo ? parseDateOnly(t.validTo) : null } });
  }
  for (const t of plan.templateCreates) {
    const templateId = randomUUID(); ids.set(t.id, templateId);
    await tx.shiftTemplate.create({ data: { id: templateId, zoneId: snapshot.zoneId, dayOfWeek: t.dayOfWeek, startTime: parseTimeOnly(t.startTime), endTime: parseTimeOnly(t.endTime), status: t.status, validFrom: parseDateOnly(t.validFrom), validTo: t.validTo ? parseDateOnly(t.validTo) : null } });
  }
  for (const s of plan.shiftUpdates) {
    await tx.shift.update({ where: { id: s.id }, data: { templateId: s.templateId ? id(s.templateId) : null, startTime: parseTimeOnly(s.startTime), endTime: parseTimeOnly(s.endTime), status: s.status, generated: s.generated } });
  }
  if (plan.shiftCreates.length) {
    await tx.shift.createMany({ data: plan.shiftCreates.map((s) => ({ zoneId: snapshot.zoneId, templateId: s.templateId ? id(s.templateId) : null, shiftDate: parseDateOnly(s.date), startTime: parseTimeOnly(s.startTime), endTime: parseTimeOnly(s.endTime), status: s.status, generated: s.generated })) });
  }
  for (const b of plan.blockCreates) {
    // A single-turn suspension must not also become a place-wide suspension.
    await tx.shiftBlock.create({ data: { zoneId: b.shiftId ? null : snapshot.zoneId, shiftId: b.shiftId, startDate: parseDateOnly(b.from), endDate: parseDateOnly(b.to), reason: b.reason, blockType: b.shiftId ? "SPECIFIC_SHIFT" : "DATE_RANGE", createdByAdminId: adminId } });
  }
  if (plan.blockDeletes.length) await tx.shiftBlock.deleteMany({ where: { id: { in: plan.blockDeletes } } });
  for (const b of plan.blockUpdates) {
    await tx.shiftBlock.update({ where: { id: b.id }, data: { excludedShiftIds: b.excludedShiftIds ?? [] } });
  }
  await tx.auditLog.create({ data: { actorType: adminId ? "ADMIN" : "SYSTEM", actorAdminId: adminId, entityType: "zone_schedule", entityId: snapshot.zoneId, action: `SCHEDULE_${op.kind.toUpperCase()}`, beforeData: JSON.parse(JSON.stringify(snapshot)), afterData: JSON.parse(JSON.stringify({ operation: op, plan })) } });
}
