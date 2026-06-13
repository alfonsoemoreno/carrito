import { prisma } from "@/lib/prisma";

export async function getAdminOverview() {
  const [
    people,
    activePeople,
    relationships,
    zones,
    templates,
    openShifts,
    blocks,
    availability,
  ] = await Promise.all([
    prisma.person.count(),
    prisma.person.count({ where: { status: "ACTIVE" } }),
    prisma.relationship.count(),
    prisma.zone.count(),
    prisma.shiftTemplate.count(),
    prisma.shift.count({ where: { status: "OPEN" } }),
    prisma.shiftBlock.count(),
    prisma.availabilityException.count(),
  ]);

  return {
    people,
    activePeople,
    relationships,
    zones,
    templates,
    openShifts,
    blocks,
    availability,
  };
}

export async function getMasterDataPageData() {
  const [people, zones, shifts] = await Promise.all([
    prisma.person.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        status: true,
      },
    }),
    prisma.zone.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, status: true },
    }),
    prisma.shift.findMany({
      orderBy: [{ shiftDate: "asc" }, { startTime: "asc" }],
      take: 30,
      select: {
        id: true,
        shiftDate: true,
        startTime: true,
        endTime: true,
        zone: {
          select: { name: true },
        },
      },
    }),
  ]);

  return { people, zones, shifts };
}
