import assert from "node:assert/strict";
import test from "node:test";
import {
  extractClientIp,
  normalizeExportAuditFilters,
} from "../src/features/admin/exports/audit";

test("extractClientIp toma la primera IP del encabezado x-forwarded-for", () => {
  assert.equal(extractClientIp("203.0.113.10, 10.0.0.1"), "203.0.113.10");
  assert.equal(extractClientIp(" 198.51.100.5 "), "198.51.100.5");
  assert.equal(extractClientIp(null), null);
});

test("normalizeExportAuditFilters completa filtros ausentes con null", () => {
  assert.deepEqual(
    normalizeExportAuditFilters({
      from: "2026-06-01",
      to: undefined,
      zoneId: "",
    }),
    {
      from: "2026-06-01",
      to: null,
      zoneId: "",
    },
  );
});
