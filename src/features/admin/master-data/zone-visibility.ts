import type { Prisma, ZoneStatus } from "@prisma/client";

type ZoneVisibilityStore = Pick<Prisma.TransactionClient, "zone" | "auditLog">;

// Hiding a place must never delete its schedule, assignments, requests or history.
export async function setZoneVisibility(tx: ZoneVisibilityStore, input: {
  id: string;
  status: ZoneStatus;
  publicVisible: boolean;
  adminId: string;
}) {
  const zone = await tx.zone.findUnique({
    where: { id: input.id },
    select: { id: true, name: true, status: true, publicVisible: true },
  });
  if (!zone || (zone.status === input.status && zone.publicVisible === input.publicVisible)) return;
  await tx.zone.update({ where: { id: zone.id }, data: { status: input.status, publicVisible: input.publicVisible } });
  await tx.auditLog.create({ data: {
    actorType: "ADMIN", actorAdminId: input.adminId, entityType: "zone", entityId: zone.id,
    action: input.status === "INACTIVE" && !input.publicVisible ? "ZONE_ARCHIVED" : "ZONE_VISIBILITY_UPDATED",
    beforeData: { name: zone.name, status: zone.status, publicVisible: zone.publicVisible },
    afterData: { name: zone.name, status: input.status, publicVisible: input.publicVisible },
  } });
}
