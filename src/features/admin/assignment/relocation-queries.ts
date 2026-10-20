import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Fetch across all zones, independently of the inbox's zone filter.
export async function getRelocationRequests(slots: {
  shiftDate: Date; startTime: Date; endTime: Date;
}[], db: Prisma.TransactionClient = prisma) {
  if (slots.length === 0) return [];
  const uniqueSlots = [...new Map(slots.map(({ shiftDate, startTime, endTime }) => {
    const slot = { shiftDate, startTime, endTime };
    return [
      `${slot.shiftDate.toISOString()}/${slot.startTime.toISOString()}/${slot.endTime.toISOString()}`, slot,
    ] as const;
  })).values()];
  return db.shiftRequest.findMany({
    where: {
      status: "PENDING",
      shift: { assignments: { none: { status: "CONFIRMED" } } },
      OR: uniqueSlots.map((slot) => ({
        shift: slot,
        person: {
          status: "ACTIVE",
          availabilityExceptions: { none: { startDate: { lte: slot.shiftDate }, endDate: { gte: slot.shiftDate } } },
          assignmentSlotsOne: { none: { status: "CONFIRMED", shift: {
            shiftDate: slot.shiftDate, startTime: { lt: slot.endTime }, endTime: { gt: slot.startTime },
          } } },
          assignmentSlotsTwo: { none: { status: "CONFIRMED", shift: {
            shiftDate: slot.shiftDate, startTime: { lt: slot.endTime }, endTime: { gt: slot.startTime },
          } } },
        },
      })),
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true, personId: true, comments: true,
      person: { select: {
        firstName: true, lastName: true, phone: true, notes: true,
        _count: { select: {
          assignmentSlotsOne: { where: { status: "CONFIRMED" } },
          assignmentSlotsTwo: { where: { status: "CONFIRMED" } },
        } },
      } },
      shift: { select: { id: true, zoneId: true, shiftDate: true, startTime: true, endTime: true, zone: { select: { name: true } } } },
    },
  });
}
