import { Prisma, PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";

const zoneId = "8278d200-c430-43e2-b22c-6127d533c76d";
const sourceHost = process.env.RECOVERY_SOURCE_HOST;
const sourceBranch = process.env.RECOVERY_SOURCE_BRANCH;
if (!sourceHost || !sourceBranch || !/^[a-z0-9.-]+\.neon\.tech$/.test(sourceHost) || !/^[a-z0-9-]+$/.test(sourceBranch)) throw new Error("Invalid recovery source");
const sourceUrl = new URL(process.env.DATABASE_URL);
sourceUrl.hostname = sourceHost;
const source = new PrismaClient({ datasourceUrl: sourceUrl.toString() });
const target = new PrismaClient();
try {
  const zone = await source.zone.findUnique({ where: { id: zoneId } });
  if (!zone || zone.name !== "Mirador del Remo") throw new Error("Recovery source is missing the expected zone");
  const [templates, shifts, blocks] = await Promise.all([
    source.shiftTemplate.findMany({ where: { zoneId } }),
    source.shift.findMany({ where: { zoneId }, orderBy: [{ shiftDate: "asc" }, { startTime: "asc" }] }),
    source.shiftBlock.findMany({ where: { OR: [{ zoneId }, { shift: { zoneId } }] } }),
  ]);
  const shiftIds = shifts.map((shift) => shift.id);
  const [requests, assignments] = await Promise.all([
    source.shiftRequest.findMany({ where: { shiftId: { in: shiftIds } } }),
    source.assignment.findMany({ where: { shiftId: { in: shiftIds } } }),
  ]);
  const auditLogs = await source.auditLog.findMany({ where: { OR: [
    { entityType: "zone", entityId: zoneId },
    { entityType: "shift_request", entityId: { in: requests.map((row) => row.id) } },
    { entityType: "assignment", entityId: { in: assignments.map((row) => row.id) } },
  ] } });
  const snapshot = { sourceHost, sourceBranch, capturedAt: new Date().toISOString(), zone, templates, shifts, blocks, requests, assignments, auditLogs };
  await mkdir(".recovery", { recursive: true, mode: 0o700 });
  await writeFile(`.recovery/${sourceBranch}.json`, JSON.stringify(snapshot, null, 2), { mode: 0o600 });
  const existing = await target.zone.findFirst({ where: { OR: [{ id: zoneId }, { name: zone.name }] }, select: { id: true, name: true } });
  const requiredPeople = [...new Set([...requests.flatMap((row) => [row.personId, row.suggestedPartnerId].filter(Boolean)), ...assignments.flatMap((row) => [row.person1Id, row.person2Id])])];
  const people = await target.person.findMany({ where: { id: { in: requiredPeople } }, select: { id: true } });
  const missingPeople = requiredPeople.filter((id) => !people.some((person) => person.id === id));
  const currentAssignments = await target.assignment.findMany({
    where: { status: "CONFIRMED", OR: [{ person1Id: { in: requiredPeople } }, { person2Id: { in: requiredPeople } }] },
    select: { id: true, person1Id: true, person2Id: true, shift: { select: { shiftDate: true, startTime: true, endTime: true } } },
  });
  const conflicts = assignments.filter((row) => row.status === "CONFIRMED").flatMap((row) => {
    const shift = shifts.find((item) => item.id === row.shiftId);
    return currentAssignments.filter((current) =>
      [row.person1Id, row.person2Id].some((id) => [current.person1Id, current.person2Id].includes(id)) &&
      current.shift.shiftDate.getTime() === shift.shiftDate.getTime() &&
      current.shift.startTime < shift.endTime && current.shift.endTime > shift.startTime,
    ).map((current) => ({ recoveredAssignmentId: row.id, currentAssignmentId: current.id }));
  });
  const requiredAdmins = [...new Set([...blocks.map((row) => row.createdByAdminId), ...assignments.map((row) => row.decidedByAdminId), ...auditLogs.map((row) => row.actorAdminId)].filter(Boolean))];
  const admins = await target.adminUser.findMany({ where: { id: { in: requiredAdmins } }, select: { id: true } });
  const missingAdmins = requiredAdmins.filter((id) => !admins.some((admin) => admin.id === id));
  const lastModifiedAt = [...templates, ...shifts, ...requests, ...assignments].reduce((latest, row) => row.updatedAt > latest ? row.updatedAt : latest, new Date(0)).toISOString();
  const summary = { mode: process.argv.includes("--apply") ? "apply" : "dry-run", existing, zone: zone.name, templates: templates.length, shifts: shifts.length, requests: requests.length, assignments: assignments.length, confirmedAssignments: assignments.filter((row) => row.status === "CONFIRMED").length, blocks: blocks.length, auditLogs: auditLogs.length, missingPeople: missingPeople.length, missingAdmins: missingAdmins.length, conflicts: conflicts.length, lastModifiedAt };
  console.log(JSON.stringify(summary));
  if (process.argv.includes("--apply")) {
    if (existing || missingPeople.length || missingAdmins.length || conflicts.length) throw new Error("Recovery preconditions failed; refusing to overwrite or create conflicting assignments");
    await target.$transaction(async (tx) => {
      if (await tx.zone.findFirst({ where: { OR: [{ id: zoneId }, { name: zone.name }] } })) throw new Error("Zone was recreated while preparing recovery");
      const liveAssignments = await tx.assignment.findMany({
        where: { status: "CONFIRMED", OR: [{ person1Id: { in: requiredPeople } }, { person2Id: { in: requiredPeople } }] },
        select: { person1Id: true, person2Id: true, shift: { select: { shiftDate: true, startTime: true, endTime: true } } },
      });
      for (const assignment of assignments.filter((row) => row.status === "CONFIRMED")) {
        const shift = shifts.find((row) => row.id === assignment.shiftId);
        if (liveAssignments.some((current) =>
          [assignment.person1Id, assignment.person2Id].some((id) => [current.person1Id, current.person2Id].includes(id)) &&
          current.shift.shiftDate.getTime() === shift.shiftDate.getTime() &&
          current.shift.startTime < shift.endTime && current.shift.endTime > shift.startTime,
        )) throw new Error("Assignment conflict appeared before recovery; rolling back");
      }
      await tx.zone.create({ data: zone });
      if (templates.length) await tx.shiftTemplate.createMany({ data: templates });
      if (shifts.length) await tx.shift.createMany({ data: shifts });
      if (blocks.length) await tx.shiftBlock.createMany({ data: blocks });
      if (requests.length) await tx.shiftRequest.createMany({ data: requests });
      if (assignments.length) await tx.assignment.createMany({ data: assignments });
      if (auditLogs.length) await tx.auditLog.createMany({ data: auditLogs.map((row) => ({
        ...row, beforeData: row.beforeData ?? Prisma.DbNull, afterData: row.afterData ?? Prisma.DbNull, meta: row.meta ?? Prisma.DbNull,
      })) });
      await tx.auditLog.create({ data: {
        actorType: "SYSTEM", entityType: "zone", entityId: zoneId, action: "ZONE_RECOVERED_FROM_HISTORY",
        afterData: { sourceBranch: snapshot.sourceBranch, templates: templates.length, shifts: shifts.length, requests: requests.length, assignments: assignments.length, recoveredAuditLogs: auditLogs.length },
      } });
    }, { timeout: 30000, isolationLevel: "Serializable" });
    const restored = await target.zone.findUnique({ where: { id: zoneId }, select: { name: true, _count: { select: { shifts: true, templates: true } } } });
    console.log(JSON.stringify({ restored }));
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await Promise.all([source.$disconnect(), target.$disconnect()]);
}
