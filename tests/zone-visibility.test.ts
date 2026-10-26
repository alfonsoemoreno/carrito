import assert from "node:assert/strict";
import test from "node:test";
import { setZoneVisibility } from "../src/features/admin/master-data/zone-visibility";

function store() {
  const zone = { id: "zone", name: "Mirador del Remo", status: "ACTIVE", publicVisible: true };
  const logs: unknown[] = [];
  const related = { shifts: ["shift"], assignments: ["pair"], requests: ["request"], audit: ["history"] };
  const tx = {
    zone: {
      findUnique: async () => ({ ...zone }),
      update: async ({ data }: { data: { status: string; publicVisible: boolean } }) => Object.assign(zone, data),
    },
    auditLog: { create: async ({ data }: { data: unknown }) => { logs.push(data); } },
  };
  return { tx: tx as unknown as Parameters<typeof setZoneVisibility>[0], zone, logs, related };
}

test("archiving retains schedules, requests, assignments and earlier audit entries", async () => {
  const db = store();
  const before = structuredClone(db.related);
  await setZoneVisibility(db.tx, { id: "zone", status: "INACTIVE", publicVisible: false, adminId: "admin" });
  assert.equal(db.zone.status, "INACTIVE");
  assert.equal(db.zone.publicVisible, false);
  assert.deepEqual(db.related, before);
  assert.deepEqual(db.logs[0], {
    actorType: "ADMIN", actorAdminId: "admin", entityType: "zone", entityId: "zone", action: "ZONE_ARCHIVED",
    beforeData: { name: "Mirador del Remo", status: "ACTIVE", publicVisible: true },
    afterData: { name: "Mirador del Remo", status: "INACTIVE", publicVisible: false },
  });
  await setZoneVisibility(db.tx, { id: "zone", status: "ACTIVE", publicVisible: true, adminId: "admin" });
  assert.equal(db.zone.status, "ACTIVE");
  assert.deepEqual(db.related, before);
  assert.equal(db.logs.length, 2);
});

test("archiving an already archived place is idempotent", async () => {
  const db = store();
  const input = { id: "zone", status: "INACTIVE" as const, publicVisible: false, adminId: "admin" };
  await setZoneVisibility(db.tx, input);
  await setZoneVisibility(db.tx, input);
  assert.equal(db.logs.length, 1);
});
