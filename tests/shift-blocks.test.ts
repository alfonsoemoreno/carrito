import assert from "node:assert/strict";
import test from "node:test";
import { blockAppliesToShift } from "../src/lib/shift-blocks";
import { dailyShiftRows, type DailyShift } from "../src/features/admin/exports/daily-shifts";
import { pendingShiftRows } from "../src/features/admin/exports/pending-shifts";

const date = new Date("2026-11-23T00:00:00Z");
const block = { startDate: date, endDate: date, excludedShiftIds: ["reactivated"] };
test("a place suspension stays effective for other turns while allowing its explicit exception", () => {
  assert.equal(blockAppliesToShift("reactivated", date, block), false);
  assert.equal(blockAppliesToShift("other", date, block), true);
  assert.equal(blockAppliesToShift("other", "2026-11-24", block), false);
  assert.equal(blockAppliesToShift("other", "2026-11-23", { startDate: "2026-11-23", endDate: "2026-11-23" }), true);
});
test("daily and pending reports advertise only the reactivated turn within a place suspension", () => {
  const shift: DailyShift = {
    id: "reactivated", shiftDate: date, startTime: new Date("1970-01-01T09:00:00Z"), endTime: new Date("1970-01-01T11:00:00Z"), status: "OPEN", blocks: [], assignments: [],
    zone: { id: "place", name: "Lugar", status: "ACTIVE", blocks: [block] },
  };
  const shifts = [shift, { ...shift, id: "other" }];
  assert.deepEqual(dailyShiftRows(shifts).map((s) => s.status), ["Por completar", "No disponible"]);
  assert.equal(pendingShiftRows(shifts, new Date("2026-11-12T12:00:00Z")).length, 1);
});
