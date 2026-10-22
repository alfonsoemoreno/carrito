import assert from "node:assert/strict";
import test from "node:test";
import { pendingShiftRows, pendingShiftsWhere, type PendingShift } from "../src/features/admin/exports/pending-shifts";
import { buildPendingShiftsPdf } from "../src/features/admin/exports/pending-shifts-pdf";

function shift(date: string, start = "17:00"): PendingShift {
  return {
    id: "shift", shiftDate: new Date(`${date}T00:00:00Z`),
    startTime: new Date(`1970-01-01T${start}:00Z`), endTime: new Date("1970-01-01T18:30:00Z"), blocks: [],
    zone: { id: "zone", name: "Costanera Terminal de Buses", blocks: [] },
  };
}
const now = new Date("2026-10-22T19:00:00Z"); // 16:00 in Chile.

test("pendientes includes open, active places without confirmed assignments, independently of requests", () => {
  const from = new Date("2026-10-26");
  const to = new Date("2026-11-01");
  const where = pendingShiftsWhere(from, to, "zone");
  assert.deepEqual(where.assignments, { none: { status: "CONFIRMED" } });
  assert.equal(where.status, "OPEN");
  assert.deepEqual(where.zone, { status: "ACTIVE" });
  assert.equal(where.zoneId, "zone");
  assert.equal("requests" in where, false);
  assert.equal("zoneId" in pendingShiftsWhere(from, to), false);
});

test("excludes started shifts using Chile time and date-specific blocks", () => {
  const blocked = { startDate: new Date("2026-10-26"), endDate: new Date("2026-10-26") };
  const rows = pendingShiftRows([
    shift("2026-10-21"), shift("2026-10-22", "15:30"), shift("2026-10-22", "16:00"),
    shift("2026-10-22", "17:00"),
    { ...shift("2026-10-26"), blocks: [blocked] },
    { ...shift("2026-10-26"), zone: { ...shift("2026-10-26").zone, blocks: [blocked] } },
    { ...shift("2026-10-27"), blocks: [blocked] },
  ], now);
  assert.deepEqual(rows.map((row) => row.dateKey), ["2026-10-22", "2026-10-27"]);
  assert.deepEqual(Object.keys(rows[0]).sort(), ["zoneId", "zoneName", "dateKey", "dateLabel", "timeLabel"].sort());
  // After UTC midnight it is still the preceding day in Chile.
  assert.equal(pendingShiftRows([shift("2026-10-22", "22:00")], new Date("2026-10-23T00:00:00Z")).length, 1);
});

test("renders only the public schedule fields, handles empty reports and repeats location on continued pages", () => {
  const rows = pendingShiftRows([shift("2026-10-26")], now);
  const base = { rangeLabel: "26-10-2026 al 01-11-2026", scopeLabel: "Todos los lugares", generatedAtLabel: "22-10-2026 16:00" };
  const pdf = buildPendingShiftsPdf({ ...base, rows }).toString("latin1");
  assert.ok(pdf.startsWith("%PDF-1.4"));
  assert.ok(pdf.includes("Costanera Terminal de Buses"));
  assert.ok(pdf.includes("17:00 - 18:30"));
  assert.ok(!pdf.includes("Solicitudes pendientes:"));
  const empty = buildPendingShiftsPdf({ ...base, rows: [] }).toString("latin1");
  assert.ok(empty.includes("No hay horarios pendientes"));
  const manyRows = Array.from({ length: 50 }, (_, i) => ({ ...rows[0], dateKey: String(i), dateLabel: `Lunes ${i + 1} de octubre` }));
  const multipage = buildPendingShiftsPdf({ ...base, rows: manyRows }).toString("latin1");
  assert.ok((multipage.match(/\/Type \/Page /g) ?? []).length > 1);
  assert.ok(multipage.includes("continuación"));
});
