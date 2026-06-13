import { AssignmentStatus, ShiftRequestStatus, ShiftStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime } from "@/features/admin/master-data/utils";
import { resolveStatsRange } from "@/features/admin/stats/utils";

export async function getAdminStatsPageState(rawSearchParams: Promise<{ [key: string]: string | string[] | undefined }>) {
  const searchParams = await rawSearchParams;
  const zoneId = Array.isArray(searchParams.zoneId) ? searchParams.zoneId[0] : searchParams.zoneId ?? "";
  const range = resolveStatsRange({
    from: Array.isArray(searchParams.from) ? searchParams.from[0] : searchParams.from,
    to: Array.isArray(searchParams.to) ? searchParams.to[0] : searchParams.to,
  });

  const shiftWhere = {
    shiftDate: {
      gte: range.from,
      lte: range.to,
    },
    ...(zoneId ? { zoneId } : {}),
  };

  const requestWhere = {
    shift: shiftWhere,
  };

  const assignmentWhere = {
    shift: shiftWhere,
  };

  const [zones, shifts, requests, assignments, topPeople, topZones] = await Promise.all([
    prisma.zone.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.shift.findMany({
      where: shiftWhere,
      include: {
        zone: { select: { name: true } },
        requests: {
          select: {
            id: true,
            status: true,
          },
        },
        assignments: {
          where: {
            status: AssignmentStatus.CONFIRMED,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: [{ shiftDate: "asc" }, { startTime: "asc" }],
    }),
    prisma.shiftRequest.findMany({
      where: requestWhere,
      include: {
        person: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        shift: {
          select: {
            id: true,
            shiftDate: true,
            zone: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.assignment.findMany({
      where: assignmentWhere,
      include: {
        person1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        person2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        shift: {
          select: {
            id: true,
            shiftDate: true,
            zone: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.assignment.findMany({
      where: {
        ...assignmentWhere,
        status: AssignmentStatus.CONFIRMED,
      },
      include: {
        person1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        person2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.shift.findMany({
      where: shiftWhere,
      include: {
        zone: { select: { name: true } },
        assignments: {
          where: { status: AssignmentStatus.CONFIRMED },
          select: { id: true },
        },
        requests: {
          where: { status: ShiftRequestStatus.PENDING },
          select: { id: true },
        },
      },
    }),
  ]);

  const totalShifts = shifts.length;
  const openShifts = shifts.filter((shift) => shift.status === ShiftStatus.OPEN).length;
  const blockedShifts = shifts.filter((shift) => shift.status === ShiftStatus.BLOCKED).length;
  const fullShifts = shifts.filter((shift) => shift.status === ShiftStatus.FULL).length;
  const pendingRequests = requests.filter((request) => request.status === ShiftRequestStatus.PENDING).length;
  const confirmedRequests = requests.filter((request) => request.status === ShiftRequestStatus.CONFIRMED).length;
  const rejectedRequests = requests.filter((request) => request.status === ShiftRequestStatus.REJECTED).length;
  const cancelledRequests = requests.filter((request) => request.status === ShiftRequestStatus.CANCELLED).length;
  const confirmedAssignments = assignments.filter((assignment) => assignment.status === AssignmentStatus.CONFIRMED).length;
  const replacedAssignments = assignments.filter((assignment) => assignment.status === AssignmentStatus.REPLACED).length;

  const peopleCounter = new Map<string, { label: string; count: number }>();
  for (const assignment of topPeople) {
    for (const person of [assignment.person1, assignment.person2]) {
      const current = peopleCounter.get(person.id) ?? {
        label: `${person.firstName} ${person.lastName}`,
        count: 0,
      };
      current.count += 1;
      peopleCounter.set(person.id, current);
    }
  }

  const zoneCounter = new Map<string, { label: string; total: number; covered: number; pending: number }>();
  for (const shift of topZones) {
    const current = zoneCounter.get(shift.zone.name) ?? {
      label: shift.zone.name,
      total: 0,
      covered: 0,
      pending: 0,
    };
    current.total += 1;
    if (shift.assignments.length > 0) {
      current.covered += 1;
    }
    if (shift.requests.length > 0) {
      current.pending += 1;
    }
    zoneCounter.set(shift.zone.name, current);
  }

  const coverageRate = totalShifts === 0 ? 0 : Math.round((fullShifts / totalShifts) * 100);

  return {
    filters: {
      zoneId,
      from: range.fromValue,
      to: range.toValue,
    },
    zones,
    kpis: {
      totalShifts,
      openShifts,
      blockedShifts,
      fullShifts,
      pendingRequests,
      confirmedRequests,
      rejectedRequests,
      cancelledRequests,
      confirmedAssignments,
      replacedAssignments,
      coverageRate,
    },
    topPeople: [...peopleCounter.values()].sort((a, b) => b.count - a.count).slice(0, 8),
    zoneSummary: [...zoneCounter.values()].sort((a, b) => a.label.localeCompare(b.label)),
    reportRows: shifts.map((shift) => ({
      id: shift.id,
      zoneName: shift.zone.name,
      dateLabel: formatDate(shift.shiftDate),
      timeLabel: `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`,
      status: shift.status,
      pendingCount: shift.requests.filter((request) => request.status === ShiftRequestStatus.PENDING).length,
      confirmedCount: shift.assignments.length,
    })),
  };
}

export async function getPrintableCalendarData(rawSearchParams: Promise<{ [key: string]: string | string[] | undefined }>) {
  const searchParams = await rawSearchParams;
  const zoneId = Array.isArray(searchParams.zoneId) ? searchParams.zoneId[0] : searchParams.zoneId ?? "";
  const range = resolveStatsRange({
    from: Array.isArray(searchParams.from) ? searchParams.from[0] : searchParams.from,
    to: Array.isArray(searchParams.to) ? searchParams.to[0] : searchParams.to,
  });

  const shifts = await prisma.shift.findMany({
    where: {
      shiftDate: {
        gte: range.from,
        lte: range.to,
      },
      ...(zoneId ? { zoneId } : {}),
    },
    include: {
      zone: { select: { name: true } },
      assignments: {
        where: { status: AssignmentStatus.CONFIRMED },
        include: {
          person1: { select: { firstName: true, lastName: true } },
          person2: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: [{ shiftDate: "asc" }, { startTime: "asc" }],
  });

  return {
    range,
    shifts: shifts.map((shift) => ({
      id: shift.id,
      zoneName: shift.zone.name,
      dateLabel: formatDate(shift.shiftDate),
      timeLabel: `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`,
      status: shift.status,
      assignments: shift.assignments.map((assignment) => `${assignment.person1.firstName} ${assignment.person1.lastName} + ${assignment.person2.firstName} ${assignment.person2.lastName}`),
    })),
  };
}
