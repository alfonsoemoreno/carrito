import assert from "node:assert/strict";
import test from "node:test";
import { dailyShiftRows, dailyShiftsFiltersSchema, type DailyShift } from "../src/features/admin/exports/daily-shifts";
import { buildDailyShiftsPdf } from "../src/features/admin/exports/daily-shifts-pdf";

function shift(overrides: Partial<DailyShift> = {}): DailyShift {
  return {
    id: "shift", shiftDate: new Date("2026-10-26"), startTime: new Date("1970-01-01T15:30:00Z"), endTime: new Date("1970-01-01T17:00:00Z"),
    status: "OPEN", blocks: [], assignments: [], zone: { id: "a", name: "Costanera Terminal de Buses", status: "ACTIVE", blocks: [] },
    ...overrides,
  };
}
const assignment = { person1: { firstName: "Ana", lastName: "Pérez" }, person2: { firstName: "José", lastName: "Díaz" } };
const base = { date: "2026-10-26", dateLabel: "lunes, 26 de octubre de 2026", generatedAtLabel: "25-10-2026 16:00" };

test("daily PDF requires exactly one valid date", () => {
  assert.equal(dailyShiftsFiltersSchema.safeParse({ date: "2026-10-26" }).success, true);
  for (const date of [null, "", "2026-02-30", "26-10-2026", "2026-10-26T00:00:00Z"]) {
    assert.equal(dailyShiftsFiltersSchema.safeParse({ date }).success, false);
  }
});

test("daily report shows confirmed names and strips request data from unfilled shifts", () => {
  const unfilled = { ...shift(), requests: [{ person: { firstName: "NOMBRE_SOLICITANTE_PRIVADO", lastName: "PRIVADO" } }], comments: "COMENTARIO_PRIVADO" };
  const rows = dailyShiftRows([shift({ status: "FULL", assignments: [assignment] }), unfilled]);
  assert.equal(rows[0].status, "Completo");
  assert.deepEqual(rows[0].participants, ["Ana Pérez", "José Díaz"]);
  assert.equal(rows[1].status, "Por completar");
  assert.deepEqual(rows[1].participants, []);
  const pdf = buildDailyShiftsPdf({ ...base, rows }).toString("latin1");
  assert.ok(pdf.includes("Ana Pérez + José Díaz"));
  assert.ok(pdf.includes("Pareja por confirmar"));
  assert.ok(!pdf.includes("NOMBRE_SOLICITANTE_PRIVADO"));
  assert.ok(!pdf.includes("COMENTARIO_PRIVADO"));
});

test("blocks are not advertised as unfilled available slots and confirmed history stays visible", () => {
  const block = { startDate: new Date("2026-10-26"), endDate: new Date("2026-10-26") };
  const rows = dailyShiftRows([
    shift({ status: "BLOCKED" }), shift({ status: "CLOSED" }), shift({ blocks: [block] }),
    shift({ zone: { ...shift().zone, blocks: [block] } }),
    shift({ zone: { ...shift().zone, status: "INACTIVE" } }),
    shift({ status: "CLOSED", assignments: [assignment] }),
    shift({ blocks: [{ startDate: new Date("2026-10-27"), endDate: new Date("2026-10-27") }] }),
  ]);
  assert.deepEqual(rows.map((row) => row.status), ["No disponible", "No disponible", "No disponible", "No disponible", "No disponible", "Completo", "Por completar"]);
});

test("daily PDF handles empty days and repeats location and date across page breaks", () => {
  const empty = buildDailyShiftsPdf({ ...base, rows: [] }).toString("latin1");
  assert.ok(empty.includes("No hay turnos registrados"));
  const rows = dailyShiftRows(Array.from({ length: 50 }, () => shift({ assignments: [assignment] })));
  const pdf = buildDailyShiftsPdf({ ...base, rows }).toString("latin1");
  const count = (pdf.match(/\/Type \/Page /g) ?? []).length;
  assert.ok(count > 1);
  assert.equal((pdf.match(/\(2026-10-26\)/g) ?? []).length, count);
  assert.ok(pdf.includes("continuación"));
});
