import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleShiftWhere, isShiftVisible } from "../src/features/public/shift-visibility";

function shift(date: string, end: string) {
  return {
    shiftDate: new Date(`${date}T00:00:00.000Z`),
    endTime: new Date(`1970-01-01T${end}:00.000Z`),
  };
}

test("oculta turnos terminados y conserva los actuales y futuros", () => {
  const now = new Date("2026-11-12T15:00:00Z"); // 12:00 en Chile
  assert.equal(isShiftVisible(shift("2026-11-11", "23:59"), now), false);
  assert.equal(isShiftVisible(shift("2026-11-12", "11:59"), now), false);
  assert.equal(isShiftVisible(shift("2026-11-12", "12:00"), now), false);
  assert.equal(isShiftVisible(shift("2026-11-12", "12:01"), now), true);
  assert.equal(isShiftVisible(shift("2026-11-13", "08:00"), now), true);
});

test("el corte usa el día de Chile aunque UTC ya esté en el día siguiente", () => {
  const now = new Date("2026-11-13T01:00:00Z"); // 22:00 del día 12
  assert.equal(isShiftVisible(shift("2026-11-12", "23:00"), now), true);
  assert.equal(isShiftVisible(shift("2026-11-12", "22:00"), now), false);
  assert.equal(isShiftVisible(shift("2026-11-13", "00:30"), now), true);
});

test("respeta los cambios de horario de Chile sin fijar un desfase UTC", () => {
  const now = new Date("2026-06-13T16:00:00Z"); // 12:00 en horario de invierno
  assert.equal(isShiftVisible(shift("2026-06-13", "12:00"), now), false);
  assert.equal(isShiftVisible(shift("2026-06-13", "12:01"), now), true);
});

test("la consulta excluye días pasados y aplica la hora de término al día actual", () => {
  assert.deepEqual(getVisibleShiftWhere(new Date("2026-11-13T01:00:00.500Z")), {
    OR: [
      { shiftDate: { gt: new Date("2026-11-12T00:00:00Z") } },
      {
        shiftDate: new Date("2026-11-12T00:00:00Z"),
        endTime: { gt: new Date("1970-01-01T22:00:00.500Z") },
      },
    ],
  });
});

test("un turno obtenido de caché se oculta al terminar sin esperar la revalidación", () => {
  const cachedShift = shift("2026-11-12", "12:00");
  assert.equal(isShiftVisible(cachedShift, new Date("2026-11-12T14:59:59.999Z")), true);
  assert.equal(isShiftVisible(cachedShift, new Date("2026-11-12T15:00:00.000Z")), false);
});
