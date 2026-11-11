import assert from "node:assert/strict";
import test from "node:test";
import { getEventAssignmentLimitErrors, getRepeatedPairWarning } from "../src/lib/assignment-event-rules";
import { EVENT_EDITIONS } from "../src/lib/event-editions";
import { buildAssignmentWarnings } from "../src/features/admin/assignment/utils";

const shift = (id: string, day: string) => ({ id, shiftDate: new Date(`${day}T00:00:00Z`) });
const pair = { person1: { id: "ana", label: "Ana", gender: "F", status: "ACTIVE" }, person2: { id: "bea", label: "Bea", gender: "F", status: "ACTIVE" } };
const context = {
  shift: shift("target", "2026-11-29"), pair,
  person1Assignments: [23, 24, 25, 26].map((day) => shift(`s${day}`, `2026-11-${day}`)),
  person2Assignments: [],
};
const edition = EVENT_EDITIONS["ironman-valdivia"];

test("Ironman includes all seven days from November 23 through November 29", () => {
  assert.equal(edition.startDate, "2026-11-23");
  assert.equal(edition.endDate, "2026-11-29");
  assert.equal(edition.maxAssignmentsPerPerson, 5);
});

test("permits a fifth assignment and blocks a sixth for either person", () => {
  assert.deepEqual(getEventAssignmentLimitErrors(context, edition), []);
  const five = [...context.person1Assignments, shift("fifth", "2026-11-27")];
  assert.match(getEventAssignmentLimitErrors({ ...context, person1Assignments: five }, edition)[0], /Ana.*5 turnos/);
  assert.match(getEventAssignmentLimitErrors({ ...context, person1Assignments: [], person2Assignments: five }, edition)[0], /Bea.*5 turnos/);
});

test("excludes other editions, duplicate rows and the shift being replaced from the cap", () => {
  const assignments = [...context.person1Assignments, context.person1Assignments[0], context.shift, shift("old", "2026-11-22"), shift("future", "2026-11-30")];
  assert.deepEqual(getEventAssignmentLimitErrors({ ...context, person1Assignments: assignments }, edition), []);
  assert.deepEqual(getEventAssignmentLimitErrors({ ...context, person1Assignments: Array.from({ length: 8 }, (_, i) => shift(String(i), "2026-10-27")) }, EVENT_EDITIONS["tour-de-france"]), []);
});

test("warns for a repeated pair anywhere in Monday-Sunday week, regardless of person order", () => {
  const shared = shift("shared", "2026-11-23");
  const input = { ...context, person1Assignments: [shared], person2Assignments: [shared] };
  assert.match(getRepeatedPairWarning(input) ?? "", /Ana \+ Bea.*esa semana/);
  assert.match(getRepeatedPairWarning({ ...input, pair: { person1: pair.person2, person2: pair.person1 } }) ?? "", /Bea \+ Ana/);
  assert.equal(getRepeatedPairWarning({ ...input, person2Assignments: [shift("different", "2026-11-23")] }), null);
});

test("does not warn for a previous week, next week, current shift, or two identical selections", () => {
  for (const shared of [shift("before", "2026-11-22"), shift("after", "2026-11-30"), context.shift]) {
    assert.equal(getRepeatedPairWarning({ ...context, person1Assignments: [shared], person2Assignments: [shared] }), null);
  }
  assert.equal(getRepeatedPairWarning({ ...context, pair: { person1: pair.person1, person2: pair.person1 } }), null);
});

test("administrative warnings include the repeated pair rule before confirmation", () => {
  const shared = { ...shift("shared", "2026-11-23"), startTime: new Date("1970-01-01T08:00Z"), endTime: new Date("1970-01-01T09:00Z") };
  const warnings = buildAssignmentWarnings({
    ...context,
    shift: { ...context.shift, startTime: shared.startTime, endTime: shared.endTime },
    person1Assignments: [shared], person2Assignments: [shared],
    person1Availability: [], person2Availability: [], relationshipTypes: [],
    config: { allowSameSexPairing: true, allowMultiplePerDay: true, allowOverlapping: false, maxConfirmedPerWeek: 5, maxConfirmedPerMonth: 6 },
  });
  assert.deepEqual(warnings, [getRepeatedPairWarning({ ...context, person1Assignments: [shared], person2Assignments: [shared] })]);
});
