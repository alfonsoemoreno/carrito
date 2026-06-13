import assert from "node:assert/strict";
import test from "node:test";
import { buildCsv, csvEscape, resolveStatsRange } from "../src/features/admin/stats/utils";

test("resolveStatsRange respeta fechas explicitas validas", () => {
  const range = resolveStatsRange({
    from: "2026-06-01",
    to: "2026-06-30",
  });

  assert.equal(range.fromValue, "2026-06-01");
  assert.equal(range.toValue, "2026-06-30");
});

test("csvEscape escapa comas, comillas y nulos", () => {
  assert.equal(csvEscape("zona norte"), "zona norte");
  assert.equal(csvEscape("zona,norte"), '"zona,norte"');
  assert.equal(csvEscape('turno "A"'), '"turno ""A"""');
  assert.equal(csvEscape(null), "");
});

test("buildCsv construye filas separadas por salto de linea", () => {
  const csv = buildCsv([
    ["Zona", "Persona"],
    ["Zona Norte", 'Ana "Paz"'],
  ]);

  assert.equal(csv, 'Zona,Persona\nZona Norte,"Ana ""Paz"""');
});
