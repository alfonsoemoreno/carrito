import { AssignmentStatus, ShiftRequestStatus } from "@prisma/client";
import { buildAssignmentWhatsAppLink } from "@/lib/assignment-notifications";
import { getPublicSiteUrl } from "@/lib/site-url";
import { prisma } from "@/lib/prisma";
import {
  formatDate,
  formatTime,
  readFirstSearchParam,
} from "@/features/public/utils";

export async function getAdminAssignmentOverview() {
  const [pendingShifts, pendingRequests, confirmedAssignments] =
    await Promise.all([
      prisma.shift.count({
        where: {
          requests: {
            some: {
              status: ShiftRequestStatus.PENDING,
            },
          },
        },
      }),
      prisma.shiftRequest.count({
        where: {
          status: ShiftRequestStatus.PENDING,
        },
      }),
      prisma.assignment.count({
        where: {
          status: AssignmentStatus.CONFIRMED,
        },
      }),
    ]);

  return {
    pendingShifts,
    pendingRequests,
    confirmedAssignments,
  };
}

export async function getAdminRequestsPageState(
  rawSearchParams: Promise<{ [key: string]: string | string[] | undefined }>,
) {
  const searchParams = await rawSearchParams;
  const zoneId = readFirstSearchParam(searchParams.zoneId);
  const onlyPending = readFirstSearchParam(searchParams.onlyPending);
  const showResolved = onlyPending !== "false";

  const [zones, shifts] = await Promise.all([
    prisma.zone.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.shift.findMany({
      where: {
        ...(zoneId ? { zoneId } : {}),
        ...(showResolved
          ? {
              requests: {
                some: {
                  status: ShiftRequestStatus.PENDING,
                },
              },
            }
          : {}),
      },
      orderBy: [{ shiftDate: "asc" }, { startTime: "asc" }],
      include: {
        zone: {
          select: {
            id: true,
            name: true,
          },
        },
        requests: {
          orderBy: [{ createdAt: "asc" }],
          select: {
            id: true,
            status: true,
            comments: true,
            person: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        assignments: {
          where: {
            status: AssignmentStatus.CONFIRMED,
          },
          select: {
            id: true,
            person1: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            person2: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    filters: {
      zoneId,
      onlyPending: showResolved ? "true" : "false",
    },
    notice: readFirstSearchParam(searchParams.notice),
    error: readFirstSearchParam(searchParams.error),
    zones,
    shifts: shifts.map((shift) => {
      const pending = shift.requests.filter(
        (request) => request.status === ShiftRequestStatus.PENDING,
      );
      const resolved = shift.requests.filter(
        (request) => request.status !== ShiftRequestStatus.PENDING,
      );

      return {
        id: shift.id,
        zoneName: shift.zone.name,
        dateLabel: formatDate(shift.shiftDate),
        timeLabel: `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`,
        pendingCount: pending.length,
        resolvedCount: resolved.length,
        requesters: pending.map((request) => ({
          id: request.id,
          name: `${request.person.firstName} ${request.person.lastName}`,
          comments: request.comments,
        })),
        currentAssignmentLabel: shift.assignments[0]
          ? `${shift.assignments[0].person1.firstName} ${shift.assignments[0].person1.lastName} + ${shift.assignments[0].person2.firstName} ${shift.assignments[0].person2.lastName}`
          : null,
      };
    }),
  };
}

export async function getShiftAssignmentPageState(
  shiftId: string,
  rawSearchParams: Promise<{ [key: string]: string | string[] | undefined }>,
) {
  const searchParams = await rawSearchParams;

  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: {
      zone: {
        select: {
          id: true,
          name: true,
        },
      },
      requests: {
        orderBy: [{ createdAt: "asc" }],
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              gender: true,
              status: true,
            },
          },
        },
      },
      assignments: {
        orderBy: [{ createdAt: "desc" }],
        include: {
          person1: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          person2: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      },
      blocks: {
        select: {
          reason: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  if (!shift) {
    return null;
  }

  const [activePeople, config, sameDayAssignments] = await Promise.all([
    prisma.person.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),
    prisma.systemConfig.findFirst({
      orderBy: { createdAt: "asc" },
      select: {
        allowSameSexPairing: true,
        maxConfirmedPerWeek: true,
        maxConfirmedPerMonth: true,
        allowMultiplePerDay: true,
        allowOverlapping: true,
      },
    }),
    prisma.assignment.findMany({
      where: {
        status: AssignmentStatus.CONFIRMED,
        shiftId: { not: shift.id },
        shift: { shiftDate: shift.shiftDate },
      },
      orderBy: [{ shift: { startTime: "asc" } }],
      select: {
        person1Id: true,
        person2Id: true,
        shift: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            zone: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const pendingRequests = shift.requests.filter(
    (request) => request.status === ShiftRequestStatus.PENDING,
  );
  const selectedPendingIds = pendingRequests.map(
    (request) => request.person.id,
  );
  const defaultPendingPersonIds = pendingRequests
    .slice(0, 2)
    .map((request) => request.person.id);
  const activeAssignment = shift.assignments.find(
    (assignment) => assignment.status === AssignmentStatus.CONFIRMED,
  );

  return {
    notice: readFirstSearchParam(searchParams.notice),
    error: readFirstSearchParam(searchParams.error),
    shift: {
      id: shift.id,
      zoneName: shift.zone.name,
      dateLabel: formatDate(shift.shiftDate),
      timeLabel: `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`,
      startTime: formatTime(shift.startTime),
      endTime: formatTime(shift.endTime),
      status: shift.status,
      blocks: shift.blocks.map((block) => block.reason),
    },
    config,
    pendingRequests: pendingRequests.map((request) => ({
      id: request.id,
      personId: request.person.id,
      personLabel: `${request.person.firstName} ${request.person.lastName}`,
      gender: request.person.gender,
      comments: request.comments,
    })),
    resolvedRequests: shift.requests
      .filter((request) => request.status !== ShiftRequestStatus.PENDING)
      .map((request) => ({
        id: request.id,
        status: request.status,
        personLabel: `${request.person.firstName} ${request.person.lastName}`,
        comments: request.comments,
      })),
    assignments: shift.assignments.map((assignment) => ({
      id: assignment.id,
      status: assignment.status,
      ruleExceptionUsed: assignment.ruleExceptionUsed,
      exceptionReason: assignment.exceptionReason,
      pairLabel: `${assignment.person1.firstName} ${assignment.person1.lastName} + ${assignment.person2.firstName} ${assignment.person2.lastName}`,
      whatsappRecipients: [assignment.person1, assignment.person2].map((person, index) => ({
        id: person.id,
        label: `${person.firstName} ${person.lastName}`,
        href: buildAssignmentWhatsAppLink({
          phone: person.phone,
          name: person.firstName,
          partner: index === 0
            ? `${assignment.person2.firstName} ${assignment.person2.lastName}`
            : `${assignment.person1.firstName} ${assignment.person1.lastName}`,
          status: assignment.status,
          zone: shift.zone.name,
          date: formatDate(shift.shiftDate),
          time: `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`,
          siteUrl: getPublicSiteUrl().toString(),
        }),
      })),
    })),
    activeAssignment: activeAssignment
      ? {
          id: activeAssignment.id,
          pairLabel: `${activeAssignment.person1.firstName} ${activeAssignment.person1.lastName} + ${activeAssignment.person2.firstName} ${activeAssignment.person2.lastName}`,
        }
      : null,
    activePeople: activePeople.map((person) => ({
      id: person.id,
      label: `${person.firstName} ${person.lastName}`,
      requested: selectedPendingIds.includes(person.id),
    })),
    sameDayAssignments: sameDayAssignments.map((assignment) => ({
      shiftId: assignment.shift.id,
      person1Id: assignment.person1Id,
      person2Id: assignment.person2Id,
      startTime: formatTime(assignment.shift.startTime),
      endTime: formatTime(assignment.shift.endTime),
      zoneName: assignment.shift.zone.name,
    })),
    defaults: {
      person1Id: defaultPendingPersonIds[0] ?? "",
      person2Id: defaultPendingPersonIds[1] ?? "",
    },
  };
}
