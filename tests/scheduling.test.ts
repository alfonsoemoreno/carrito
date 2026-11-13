import assert from "node:assert/strict";
import test from "node:test";
import { addDays, planSchedule, scheduleOperationSchema, templatesOverlap, type ScheduleSnapshot, type ScheduleTemplate, type ScheduledShift } from "../src/features/admin/scheduling/planning";
import { persistSchedulePlan, reviewSchedule } from "../src/features/admin/scheduling/service";

const today = "2026-11-12"; // Thursday
const uuid = "00000000-0000-4000-8000-000000000001";
const template = (extra: Partial<ScheduleTemplate> = {}): ScheduleTemplate => ({ id: uuid, dayOfWeek: 1, startTime: "09:00", endTime: "11:00", status: "ACTIVE", validFrom: "2026-11-01", validTo: "2026-12-31", ...extra });
const shift = (extra: Partial<ScheduledShift> = {}): ScheduledShift => ({ id: "shift", templateId: uuid, date: "2026-11-16", startTime: "09:00", endTime: "11:00", status: "OPEN", generated: true, requests: 0, assignments: 0, activeRequests: 0, confirmedAssignments: 0, ...extra });
const snapshot = (extra: Partial<ScheduleSnapshot> = {}): ScheduleSnapshot => ({ zoneId: "zone", active: true, templates: [], shifts: [], blocks: [], ...extra });
const generate = { kind: "generate" as const, from: today, to: "2026-11-30" };
const edit = { kind: "editSchedule" as const, templateId: uuid, from: "2026-11-16", startTime: "11:00", endTime: "13:00" };

test("several days and several time blocks create all occurrences within the inclusive period", () => {
  const plan = planSchedule(snapshot(), { kind: "schedule", from: "2026-11-16", to: "2026-11-20", slots: [
    { days: [1, 3, 5], startTime: "09:00", endTime: "11:00" },
    { days: [1, 3, 5], startTime: "11:00", endTime: "13:00" },
  ] }, today);
  assert.deepEqual(plan.conflicts, []);
  assert.equal(plan.templateCreates.length, 6);
  assert.equal(plan.shiftCreates.length, 6);
  assert.deepEqual(plan.dates, ["2026-11-16", "2026-11-18", "2026-11-20"]);
});
test("an overlap blocks the whole plan, while adjacent time slots are allowed", () => {
  assert.equal(templatesOverlap(template(), template({ id: "other", startTime: "11:00", endTime: "13:00" }), today), false);
  const plan = planSchedule(snapshot({ templates: [template()] }), { kind: "schedule", from: today, to: "2026-11-30", slots: [{ days: [1], startTime: "10:00", endTime: "12:00" }] }, today);
  assert.ok(plan.conflicts.length);
});
test("periods without a shared occurrence do not conflict", () => {
  assert.equal(templatesOverlap(template({ validTo: "2026-11-15" }), template({ id: "other", validFrom: "2026-11-16" }), today), false);
});
test("a selected weekday outside the period is reported instead of silently creating nothing", () => {
  const plan = planSchedule(snapshot(), { kind: "schedule", from: today, to: today, slots: [{ days: [1], startTime: "09:00", endTime: "11:00" }] }, today);
  assert.equal(plan.conflicts.length, 1);
});
test("generation honors schedule validity, pause state and reuses existing occurrences", () => {
  const plan = planSchedule(snapshot({ templates: [template({ validFrom: "2026-11-16", validTo: "2026-11-23" }), template({ id: "paused", dayOfWeek: 2, status: "INACTIVE" })], shifts: [shift()] }), generate, today);
  assert.equal(plan.existing, 1);
  assert.deepEqual(plan.shiftCreates.map((s) => s.date), ["2026-11-23"]);
});
test("a one-date time exception is not recreated at its original time", () => {
  const plan = planSchedule(snapshot({ templates: [template()], shifts: [shift({ generated: false, startTime: "13:00", endTime: "15:00" })] }), { ...generate, to: "2026-11-16" }, today);
  assert.equal(plan.existing, 1);
  assert.equal(plan.shiftCreates.length, 0);
});
test("an existing punctual turn with the same exact slot is reused", () => {
  const plan = planSchedule(snapshot({ templates: [template()], shifts: [shift({ templateId: null, generated: false })] }), { ...generate, to: "2026-11-16" }, today);
  assert.equal(plan.existing, 1);
  assert.equal(plan.shiftCreates.length, 0);
});
test("generation rejects an overlap with a punctual turn", () => {
  const plan = planSchedule(snapshot({ templates: [template()], shifts: [shift({ templateId: null, startTime: "10:00", endTime: "12:00" })] }), generate, today);
  assert.ok(plan.conflicts.some((c) => c.shiftId === "shift"));
});
test("editing splits the recurring period and keeps past occurrence IDs and times untouched", () => {
  const past = shift({ id: "past", date: "2026-11-09" });
  const plan = planSchedule(snapshot({ templates: [template()], shifts: [past, shift()] }), edit, today);
  assert.deepEqual(plan.conflicts, []);
  assert.equal(plan.templateUpdates[0].validTo, "2026-11-15");
  assert.equal(plan.templateCreates[0].validFrom, "2026-11-16");
  assert.equal(plan.shiftUpdates[0].id, "shift");
  assert.equal(plan.shiftUpdates[0].startTime, "11:00");
  assert.ok(!plan.shiftUpdates.some((s) => s.id === "past"));
  assert.equal(past.startTime, "09:00");
});
test("editing on the first valid date updates in place without duplicate schedule versions", () => {
  const plan = planSchedule(snapshot({ templates: [template({ validFrom: edit.from })], shifts: [shift()] }), edit, today);
  assert.equal(plan.templateCreates.length, 0);
  assert.equal(plan.templateUpdates[0].startTime, "11:00");
  assert.equal(plan.shiftUpdates[0].templateId, uuid);
});
test("editing a recurring period preserves deliberate single-date exceptions", () => {
  const plan = planSchedule(snapshot({ templates: [template()], shifts: [shift({ generated: false, startTime: "14:00", endTime: "16:00", requests: 1 })] }), edit, today);
  assert.deepEqual(plan.conflicts, []);
  assert.equal(plan.shiftUpdates[0].startTime, "14:00");
  assert.equal(plan.shiftUpdates[0].generated, false);
  assert.equal(plan.shiftUpdates[0].templateId, plan.templateCreates[0].id);
});
test("editing recurring shifts with active requests or confirmed assignments requires resolution", () => {
  for (const extra of [{ activeRequests: 1 }, { confirmedAssignments: 1 }]) {
    const plan = planSchedule(snapshot({ templates: [template()], shifts: [shift(extra)] }), edit, today);
    assert.ok(plan.conflicts.some((c) => c.shiftId === "shift"));
  }
});
test("pausing only stops generation and never suspends or deletes existing shifts", () => {
  const plan = planSchedule(snapshot({ templates: [template()], shifts: [shift({ confirmedAssignments: 1 })] }), { kind: "toggle", templateId: uuid, active: false }, today);
  assert.deepEqual(plan.conflicts, []);
  assert.equal(plan.templateUpdates[0].status, "INACTIVE");
  assert.deepEqual(plan.shiftUpdates, []);
  assert.deepEqual(plan.blockCreates, []);
});
test("expired schedules cannot resume; overlapping schedules cannot resume", () => {
  const expired = planSchedule(snapshot({ templates: [template({ status: "INACTIVE", validTo: "2026-11-10" })] }), { kind: "toggle", templateId: uuid, active: true }, today);
  assert.ok(expired.conflicts.length);
  const overlap = planSchedule(snapshot({ templates: [template({ status: "INACTIVE" }), template({ id: "other" })] }), { kind: "toggle", templateId: uuid, active: true }, today);
  assert.ok(overlap.conflicts.length);
});
test("single-turn editing creates an exception and cannot change its date or its history", () => {
  const op = { kind: "single" as const, shiftId: "shift", date: "2026-11-16", startTime: "12:00", endTime: "14:00" };
  const data = snapshot({ templates: [template()], shifts: [shift()] });
  const plan = planSchedule(data, op, today);
  assert.deepEqual(plan.conflicts, []);
  assert.equal(plan.shiftUpdates[0].generated, false);
  assert.equal(plan.shiftUpdates[0].templateId, uuid);
  assert.ok(planSchedule(data, { ...op, date: "2026-11-17" }, today).conflicts.length);
  assert.ok(planSchedule(snapshot({ shifts: [shift({ confirmedAssignments: 1 })] }), op, today).conflicts.length);
});
test("punctual creation respects future recurring slots, even if not materialized yet", () => {
  const plan = planSchedule(snapshot({ templates: [template()] }), { kind: "single", date: "2026-11-16", startTime: "10:00", endTime: "12:00" }, today);
  assert.ok(plan.conflicts.length);
});
test("place suspensions apply to existing and future generated turns", () => {
  const data = snapshot({ templates: [template()], shifts: [shift()] });
  const block = { kind: "block" as const, from: "2026-11-16", to: "2026-11-23", reason: "Cierre temporal" };
  const plan = planSchedule(data, block, today);
  assert.deepEqual(plan.conflicts, []);
  assert.equal(plan.shiftUpdates[0].status, "BLOCKED");
  const future = planSchedule({ ...data, blocks: plan.blockCreates }, generate, today);
  assert.equal(future.shiftCreates.find((s) => s.date === "2026-11-23")?.status, "BLOCKED");
});
test("suspensions reject pending requests and confirmed assignments", () => {
  for (const extra of [{ activeRequests: 1 }, { confirmedAssignments: 1 }]) {
    const plan = planSchedule(snapshot({ shifts: [shift(extra)] }), { kind: "block", from: "2026-11-16", to: "2026-11-16", reason: "Feriado" }, today);
    assert.ok(plan.conflicts.some((c) => c.shiftId === "shift"));
  }
});
test("single-turn blocks cannot target a different date or an unrelated shift", () => {
  const plan = planSchedule(snapshot({ shifts: [shift()] }), { kind: "block", shiftId: "shift", from: today, to: today, reason: "Feriado" }, today);
  assert.ok(plan.conflicts.length);
});
test("removing one suspension preserves overlapping suspensions", () => {
  const blocks = ["a", "b"].map((id) => ({ id, shiftId: null, from: "2026-11-16", to: "2026-11-16", reason: "Cierre" }));
  const data = snapshot({ shifts: [shift({ status: "BLOCKED" })], blocks });
  const one = planSchedule(data, { kind: "unblock", blockId: "a" }, today);
  assert.equal(one.shiftUpdates[0].status, "BLOCKED");
  const last = planSchedule({ ...data, blocks: [blocks[0]] }, { kind: "unblock", blockId: "a" }, today);
  assert.equal(last.shiftUpdates[0].status, "OPEN");
});
test("removing a suspension retains confirmed assignment status", () => {
  const plan = planSchedule(snapshot({ shifts: [shift({ confirmedAssignments: 1 })], blocks: [{ id: "a", shiftId: "shift", from: "2026-11-16", to: "2026-11-16", reason: "Cierre" }] }), { kind: "unblock", blockId: "a" }, today);
  assert.equal(plan.shiftUpdates[0].status, "FULL");
});
test("validation rejects inverted ranges, invalid times and empty weekdays", () => {
  assert.equal(scheduleOperationSchema.safeParse({ ...generate, to: "2026-11-01" }).success, false);
  assert.equal(scheduleOperationSchema.safeParse({ kind: "single", date: today, startTime: "25:00", endTime: "26:00" }).success, false);
  assert.equal(scheduleOperationSchema.safeParse({ kind: "schedule", from: today, to: today, slots: [{ days: [], startTime: "09:00", endTime: "11:00" }] }).success, false);
  assert.equal(scheduleOperationSchema.safeParse({ ...generate, to: "2028-01-01" }).success, false);
});
test("past dates and inactive places cannot create or change schedules", () => {
  assert.ok(planSchedule(snapshot(), { ...generate, from: "2026-11-01" }, today).conflicts.length);
  assert.ok(planSchedule(snapshot({ active: false }), generate, today).conflicts.length);
  assert.ok(planSchedule(snapshot({ active: false, templates: [template()] }), { kind: "toggle", templateId: uuid, active: true }, today).conflicts.length);
});
test("review fingerprint changes when another administrator changes data or the date rolls over", () => {
  const data = snapshot({ templates: [template()] });
  const first = reviewSchedule(data, generate, today);
  assert.equal(first.token, reviewSchedule(structuredClone(data), generate, today).token);
  assert.notEqual(first.token, reviewSchedule({ ...data, shifts: [shift()] }, generate, today).token);
  assert.notEqual(first.token, reviewSchedule(data, generate, addDays(today, 1)).token);
});
test("conflicting plans never write, and a single-shift suspension is not stored as a zone suspension", async () => {
  const writes: unknown[] = [];
  const tx = {
    shift: { update: async (args: unknown) => writes.push(args) },
    shiftBlock: { create: async (args: unknown) => writes.push(args) },
    auditLog: { create: async (args: unknown) => writes.push(args) },
  } as unknown as Parameters<typeof persistSchedulePlan>[0];
  const data = snapshot({ shifts: [shift()] });
  const op = { kind: "block" as const, shiftId: "shift", from: "2026-11-16", to: "2026-11-16", reason: "Cierre" };
  const plan = planSchedule(data, op, today);
  await assert.rejects(persistSchedulePlan(tx, data, op, { ...plan, conflicts: [{ message: "conflict" }] }, "admin"));
  assert.equal(writes.length, 0);
  await persistSchedulePlan(tx, data, op, plan, "admin");
  const blockWrite = writes[1] as { data: { zoneId: string | null; shiftId: string } };
  assert.equal(blockWrite.data.zoneId, null);
  assert.equal(blockWrite.data.shiftId, "shift");
});

test("a paused duplicate is identified during review instead of failing on the database constraint", () => {
  const plan = planSchedule(snapshot({ templates: [template({ status: "INACTIVE", validFrom: today })] }), { kind: "schedule", from: today, to: "2026-11-30", slots: [{ days: [1], startTime: "09:00", endTime: "11:00" }] }, today);
  assert.ok(plan.conflicts.some((c) => c.message.includes("Reanúdalo")));
});
test("resolved requests and cancelled assignments retain their history without preventing a time correction", () => {
  const data = snapshot({ shifts: [shift({ requests: 2, assignments: 1 })] });
  const plan = planSchedule(data, { kind: "single", shiftId: "shift", date: "2026-11-16", startTime: "12:00", endTime: "14:00" }, today);
  assert.deepEqual(plan.conflicts, []);
  assert.equal(plan.shiftUpdates[0].id, "shift");
  assert.equal(plan.shiftUpdates[0].requests, 2);
  assert.equal(plan.shiftUpdates[0].assignments, 1);
});
test("batch persistence maps each generated occurrence to its persisted schedule UUID", async () => {
  const templates: { id: string; startTime: Date; dayOfWeek: number; validFrom: Date; validTo: Date }[] = [];
  let shifts: { templateId: string; shiftDate: Date; startTime: Date; generated: boolean }[] = [];
  const tx = {
    shiftTemplate: { create: async ({ data }: { data: typeof templates[number] }) => { templates.push(data); } },
    shift: { createMany: async ({ data }: { data: typeof shifts }) => { shifts = data; } },
    auditLog: { create: async () => ({}) },
  } as unknown as Parameters<typeof persistSchedulePlan>[0];
  const data = snapshot();
  const op = { kind: "schedule" as const, from: "2026-11-16", to: "2026-11-20", slots: [{ days: [1, 5], startTime: "09:00", endTime: "11:00" }] };
  await persistSchedulePlan(tx, data, op, planSchedule(data, op, today), "admin");
  assert.equal(templates.length, 2);
  assert.equal(shifts.length, 2);
  for (const s of shifts) {
    const t = templates.find((t) => t.id === s.templateId);
    assert.ok(t);
    assert.match(t.id, /^[a-f0-9-]{36}$/);
    assert.equal(t.dayOfWeek, s.shiftDate.getUTCDay());
    assert.equal(t.validFrom.toISOString(), "2026-11-16T00:00:00.000Z");
    assert.equal(t.validTo.toISOString(), "2026-11-20T00:00:00.000Z");
    assert.equal(s.startTime.getUTCHours(), 9);
    assert.equal(s.generated, true);
  }
});

test("editing a suspended turn preserves its suspension, reason and recurring occurrence", () => {
  for (const blockShiftId of [null, "shift"]) {
    const data = snapshot({ templates: [template()], shifts: [shift({ status: "BLOCKED" })], blocks: [
      { id: "suspension", shiftId: blockShiftId, from: "2026-11-16", to: "2026-11-16", reason: "Lugar cerrado" },
    ] });
    const before = structuredClone(data);
    const plan = planSchedule(data, { kind: "single", shiftId: "shift", date: "2026-11-16", startTime: "13:00", endTime: "15:00" }, today);
    assert.deepEqual(plan.conflicts, []);
    assert.equal(plan.shiftUpdates[0].status, "BLOCKED");
    assert.equal(plan.shiftUpdates[0].startTime, "13:00");
    assert.equal(plan.shiftUpdates[0].templateId, uuid);
    assert.equal(plan.shiftUpdates[0].generated, false);
    assert.deepEqual(plan.blockCreates, []);
    assert.deepEqual(plan.blockDeletes, []);
    assert.deepEqual(data, before);
  }
});
test("editing a turn marked BLOCKED does not silently reopen it when no block record exists", () => {
  const plan = planSchedule(snapshot({ shifts: [shift({ status: "BLOCKED" })] }), { kind: "single", shiftId: "shift", date: "2026-11-16", startTime: "12:00", endTime: "14:00" }, today);
  assert.deepEqual(plan.conflicts, []);
  assert.equal(plan.shiftUpdates[0].status, "BLOCKED");
});
test("suspended turns with active commitments still reject time edits", () => {
  for (const extra of [{ activeRequests: 1 }, { confirmedAssignments: 1 }]) {
    const plan = planSchedule(snapshot({ shifts: [shift({ status: "BLOCKED", ...extra })] }), { kind: "single", shiftId: "shift", date: "2026-11-16", startTime: "12:00", endTime: "14:00" }, today);
    assert.ok(plan.conflicts.some((c) => c.shiftId === "shift"));
    assert.equal(plan.shiftUpdates.length, 0);
  }
});

test("reactivation removes all single-turn suspensions without touching another occurrence", () => {
  const data = snapshot({ shifts: [shift({ status: "BLOCKED" }), shift({ id: "other", date: "2026-11-23", status: "BLOCKED" })], blocks: [
    { id: "one", shiftId: "shift", from: "2026-11-16", to: "2026-11-16", reason: "Cierre" },
    { id: "two", shiftId: "shift", from: "2026-11-16", to: "2026-11-16", reason: "Mantenimiento" },
    { id: "other-block", shiftId: "other", from: "2026-11-23", to: "2026-11-23", reason: "Cierre" },
  ] });
  const plan = planSchedule(data, { kind: "reactivate", shiftId: "shift" }, today);
  assert.deepEqual(plan.conflicts, []);
  assert.deepEqual(plan.blockDeletes, ["one", "two"]);
  assert.deepEqual(plan.blockUpdates, []);
  assert.equal(plan.shiftUpdates.length, 1);
  assert.equal(plan.shiftUpdates[0].status, "OPEN");
});
test("reactivating within a place suspension exempts only the selected turn across all overlapping blocks", () => {
  const data = snapshot({ shifts: [shift({ status: "BLOCKED" }), shift({ id: "other", status: "BLOCKED", startTime: "11:00", endTime: "13:00" })], blocks: [
    { id: "place", shiftId: null, from: "2026-11-16", to: "2026-11-23", reason: "Cierre", excludedShiftIds: ["previous"] },
    { id: "second", shiftId: null, from: "2026-11-16", to: "2026-11-16", reason: "Feriado" },
  ] });
  const plan = planSchedule(data, { kind: "reactivate", shiftId: "shift" }, today);
  assert.deepEqual(plan.conflicts, []);
  assert.equal(plan.shiftUpdates[0].status, "OPEN");
  assert.equal(plan.blockUpdates.length, 2);
  assert.deepEqual(plan.blockUpdates[0].excludedShiftIds, ["previous", "shift"]);
  const after = { ...data, blocks: plan.blockUpdates };
  const editOther = planSchedule(after, { kind: "single", shiftId: "other", date: "2026-11-16", startTime: "13:00", endTime: "15:00" }, today);
  assert.equal(editOther.shiftUpdates[0].status, "BLOCKED");
  const editReactivated = planSchedule({ ...after, shifts: [plan.shiftUpdates[0], data.shifts[1]] }, { kind: "single", shiftId: "shift", date: "2026-11-16", startTime: "08:00", endTime: "09:00" }, today);
  assert.equal(editReactivated.shiftUpdates[0].status, "OPEN");
});
test("reactivating a status-only blocked turn works and retains confirmed assignments", () => {
  for (const confirmedAssignments of [0, 1]) {
    const plan = planSchedule(snapshot({ shifts: [shift({ status: "BLOCKED", confirmedAssignments })] }), { kind: "reactivate", shiftId: "shift" }, today);
    assert.deepEqual(plan.conflicts, []);
    assert.equal(plan.shiftUpdates[0].status, confirmedAssignments ? "FULL" : "OPEN");
  }
});
test("reactivation is idempotent and rejects past turns, inactive places and unrelated IDs", () => {
  assert.equal(planSchedule(snapshot({ shifts: [shift()] }), { kind: "reactivate", shiftId: "shift" }, today).shiftUpdates[0].status, "OPEN");
  for (const data of [snapshot(), snapshot({ active: false, shifts: [shift()] }), snapshot({ shifts: [shift({ date: "2026-11-01" })] })]) {
    const plan = planSchedule(data, { kind: "reactivate", shiftId: "shift" }, today);
    assert.ok(plan.conflicts.length);
    assert.equal(plan.shiftUpdates.length, 0);
  }
});
