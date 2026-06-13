import { AssignmentStatus, ShiftRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime, readFirstSearchParam } from "@/features/public/utils";

function buildRequestPairHint(request: {
  person: { firstName: string; lastName: string };
  suggestedPartner: { firstName: string; lastName: string } | null;
}) {
  if (!request.suggestedPartner) {
    return "Sin pareja sugerida";
  }

  return `${request.person.firstName} ${request.person.lastName} sugiere a ${request.suggestedPartner.firstName} ${request.suggestedPartner.lastName}`;
}

export async function getAdminAssignmentOverview() {
  const [pendingShifts, pendingRequests, confirmedAssignments] = await Promise.all([
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
            suggestedPartner: {
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
      const pending = shift.requests.filter((request) => request.status === ShiftRequestStatus.PENDING);
      const resolved = shift.requests.filter((request) => request.status !== ShiftRequestStatus.PENDING);

      return {
        id: shift.id,
        zoneName: shift.zone.name,
        dateLabel: formatDate(shift.shiftDate),
        timeLabel: `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`,
        pendingCount: pending.length,
        resolvedCount: resolved.length,
        pending,
        currentAssignmentLabel:
          shift.assignments[0]
            ? `${shift.assignments[0].person1.firstName} ${shift.assignments[0].person1.lastName} + ${shift.assignments[0].person2.firstName} ${shift.assignments[0].person2.lastName}`
            : null,
        pairHints: pending.map(buildRequestPairHint),
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
          suggestedPartner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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

  const [activePeople, config] = await Promise.all([
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
        allowConsecutiveDays: true,
        allowMultiplePerDay: true,
        allowOverlapping: true,
      },
    }),
  ]);

  const pendingRequests = shift.requests.filter((request) => request.status === ShiftRequestStatus.PENDING);
  const selectedPendingIds = pendingRequests.map((request) => request.person.id);
  const suggestedDefaults = pendingRequests.slice(0, 2).map((request) => request.person.id);

  return {
    notice: readFirstSearchParam(searchParams.notice),
    error: readFirstSearchParam(searchParams.error),
    shift: {
      id: shift.id,
      zoneName: shift.zone.name,
      dateLabel: formatDate(shift.shiftDate),
      timeLabel: `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`,
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
      suggestedPartnerLabel: request.suggestedPartner
        ? `${request.suggestedPartner.firstName} ${request.suggestedPartner.lastName}`
        : null,
      suggestedPartnerId: request.suggestedPartner?.id ?? null,
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
    })),
    activePeople: activePeople.map((person) => ({
      id: person.id,
      label: `${person.firstName} ${person.lastName}`,
      requested: selectedPendingIds.includes(person.id),
    })),
    defaults: {
      person1Id: suggestedDefaults[0] ?? "",
      person2Id:
        pendingRequests.find((request) => request.suggestedPartnerId)?.suggestedPartnerId ??
        suggestedDefaults[1] ??
        "",
    },
  };
}
