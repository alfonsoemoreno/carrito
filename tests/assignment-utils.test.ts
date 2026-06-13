import assert from "node:assert/strict";
import test from "node:test";
import { RelationshipType } from "@prisma/client";
import { appendAdminNote, buildAssignmentWarnings } from "../src/features/admin/assignment/utils";

function createShift(date: string, startTime: string, endTime: string) {
  return {
    id: `${date}-${startTime}`,
    shiftDate: new Date(`${date}T00:00:00.000Z`),
    startTime: new Date(`${date}T${startTime}:00.000Z`),
    endTime: new Date(`${date}T${endTime}:00.000Z`),
  };
}

test("buildAssignmentWarnings detecta reglas operativas por persona", () => {
  const warnings = buildAssignmentWarnings({
    config: {
      allowSameSexPairing: false,
      allowConsecutiveDays: false,
      allowMultiplePerDay: false,
      allowOverlapping: false,
      maxConfirmedPerWeek: 1,
      maxConfirmedPerMonth: 1,
    },
    pair: {
      person1: {
        id: "p1",
        label: "Ana",
        gender: "F",
        status: "INACTIVE",
      },
      person2: {
        id: "p2",
        label: "Berta",
        gender: "F",
        status: "ACTIVE",
      },
    },
    shift: createShift("2026-06-13", "10:00", "12:00"),
    relationshipTypes: [RelationshipType.ADMIN_EXCEPTION],
    person1Assignments: [
      createShift("2026-06-13", "09:00", "11:00"),
      createShift("2026-06-12", "08:00", "09:00"),
    ],
    person2Assignments: [],
    person1Availability: [
      {
        startDate: new Date("2026-06-12T00:00:00.000Z"),
        endDate: new Date("2026-06-14T00:00:00.000Z"),
      },
    ],
    person2Availability: [],
  });

  assert.deepEqual(warnings, [
    "Ana esta inactivo.",
    "Ana tiene indisponibilidad registrada para esa fecha.",
    "Ana ya alcanzo el maximo semanal de turnos confirmados.",
    "Ana ya alcanzo el maximo mensual de turnos confirmados.",
    "Ana ya tiene otro turno confirmado el mismo dia.",
    "Ana quedaria con dias consecutivos.",
    "Ana tiene superposicion horaria con otro turno confirmado.",
  ]);
});

test("buildAssignmentWarnings exige dos personas distintas", () => {
  const warnings = buildAssignmentWarnings({
    config: {
      allowSameSexPairing: true,
      allowConsecutiveDays: true,
      allowMultiplePerDay: true,
      allowOverlapping: true,
      maxConfirmedPerWeek: 10,
      maxConfirmedPerMonth: 10,
    },
    pair: {
      person1: {
        id: "p1",
        label: "Ana",
        gender: "F",
        status: "ACTIVE",
      },
      person2: {
        id: "p1",
        label: "Ana",
        gender: "F",
        status: "ACTIVE",
      },
    },
    shift: createShift("2026-06-13", "10:00", "12:00"),
    relationshipTypes: [RelationshipType.ADMIN_EXCEPTION],
    person1Assignments: [],
    person2Assignments: [],
    person1Availability: [],
    person2Availability: [],
  });

  assert.deepEqual(warnings, ["Debes seleccionar dos personas diferentes."]);
});

test("appendAdminNote concatena respetando el formato administrativo", () => {
  assert.equal(appendAdminNote(null, "Asignado manualmente"), "Asignado manualmente");
  assert.equal(
    appendAdminNote("Nota previa", "Asignado manualmente"),
    "Nota previa\n\n[Admin] Asignado manualmente",
  );
});
