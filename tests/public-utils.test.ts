import assert from "node:assert/strict";
import test from "node:test";
import {
  isConsecutiveUtcDate,
  isSameUtcDate,
  overlapsTimeRange,
  parseDateInput,
  readFirstSearchParam,
  toDateOnlyString,
} from "../src/features/public/utils";

test("parseDateInput convierte YYYY-MM-DD a medianoche UTC", () => {
  const parsed = parseDateInput("2026-06-13");

  assert.ok(parsed instanceof Date);
  assert.equal(parsed?.toISOString(), "2026-06-13T00:00:00.000Z");
  assert.equal(parseDateInput(""), null);
});

test("isSameUtcDate compara por fecha UTC y no por hora", () => {
  const a = new Date("2026-06-13T01:00:00.000Z");
  const b = new Date("2026-06-13T23:59:00.000Z");

  assert.equal(isSameUtcDate(a, b), true);
  assert.equal(toDateOnlyString(a), "2026-06-13");
});

test("isConsecutiveUtcDate detecta dias contiguos", () => {
  const a = new Date("2026-06-13T12:00:00.000Z");
  const b = new Date("2026-06-14T00:30:00.000Z");
  const c = new Date("2026-06-16T00:30:00.000Z");

  assert.equal(isConsecutiveUtcDate(a, b), true);
  assert.equal(isConsecutiveUtcDate(a, c), false);
});

test("overlapsTimeRange detecta superposicion horaria", () => {
  const startA = new Date("2026-06-13T09:00:00.000Z");
  const endA = new Date("2026-06-13T11:00:00.000Z");
  const startB = new Date("2026-06-13T10:00:00.000Z");
  const endB = new Date("2026-06-13T12:00:00.000Z");
  const startC = new Date("2026-06-13T11:00:00.000Z");
  const endC = new Date("2026-06-13T13:00:00.000Z");

  assert.equal(overlapsTimeRange(startA, endA, startB, endB), true);
  assert.equal(overlapsTimeRange(startA, endA, startC, endC), false);
});

test("readFirstSearchParam toma el primer valor disponible", () => {
  assert.equal(readFirstSearchParam(["uno", "dos"]), "uno");
  assert.equal(readFirstSearchParam("solo"), "solo");
  assert.equal(readFirstSearchParam(undefined), "");
});
