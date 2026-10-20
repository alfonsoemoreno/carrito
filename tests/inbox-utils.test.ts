import assert from "node:assert/strict";
import test from "node:test";
import { filterInboxShifts } from "../src/features/admin/assignment/inbox-utils";

const shifts = [
  { id: "one", dateKey: "2026-10-26", zoneName: "Valdivia TV", pendingCount: 1, currentAssignmentLabel: null,
    requesters: [{ name: "Matías Sepúlveda" }], relocationCandidates: [{ name: "María Pérez", sourceZone: "Mirador del Remo" }] },
  { id: "two", dateKey: "2026-10-27", zoneName: "Plaza Chile", pendingCount: 3, currentAssignmentLabel: null,
    requesters: [{ name: "Pedro Muñoz" }], relocationCandidates: [] },
  { id: "three", dateKey: "2026-10-26", zoneName: "Hospital", pendingCount: 0, currentAssignmentLabel: "Ana + José",
    requesters: [], relocationCandidates: [] },
];

test("busca sin tildes en solicitantes, candidatos y lugares de origen", () => {
  for (const search of ["matias sepulveda", "maria perez", "mirador"]) {
    assert.deepEqual(filterInboxShifts(shifts, { search, day: "", focus: "all" }).map((shift) => shift.id), ["one"]);
  }
  assert.equal(filterInboxShifts(shifts, { search: "ana jose", day: "", focus: "all" })[0].id, "three");
});

test("combina día y prioridad sin incluir asignados en los turnos por resolver", () => {
  assert.deepEqual(filterInboxShifts(shifts, { search: "", day: "2026-10-26", focus: "single" }).map((shift) => shift.id), ["one"]);
  assert.deepEqual(filterInboxShifts(shifts, { search: "", day: "", focus: "multiple" }).map((shift) => shift.id), ["two"]);
  assert.deepEqual(filterInboxShifts(shifts, { search: "", day: "", focus: "alternatives" }).map((shift) => shift.id), ["one"]);
  assert.deepEqual(filterInboxShifts(shifts, { search: "", day: "2026-10-26", focus: "multiple" }), []);
  assert.equal(filterInboxShifts(shifts, { search: "", day: "", focus: "all" }).length, 3);
});
