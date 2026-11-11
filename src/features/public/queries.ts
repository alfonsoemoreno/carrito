import {
  AssignmentStatus,
  PersonStatus,
  ShiftRequestStatus,
  ShiftStatus,
} from "@prisma/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getPublicSession } from "@/features/public/session";
import { EVENT, clampToEventDateRange, getEventDateRange, hasEventEnded } from "@/lib/event";
import {
  formatDate,
  formatLongDate,
  formatTime,
  parseDateInput,
  readFirstSearchParam,
  toDateOnlyString,
} from "@/features/public/utils";

const DEFAULT_CONFIG = {
  visibleWeeks: 6,
  pinMinLength: 4,
  pinMaxLength: 8,
  pinMaxAttempts: 5,
  pinLockMinutes: 15,
  maxConfirmedPerWeek: 5,
  maxConfirmedPerMonth: 6,
  allowMultiplePerDay: true,
  allowOverlapping: false,
  allowSameSexPairing: true,
  historyVisibility: "ONE_YEAR",
  showParticipantsPublicly: false,
  showPendingRequestsPublicly: false,
  showFullShiftsPublicly: true,
  showOpenShiftsPublicly: true,
  showHistoryPublicly: false,
  maintenanceModeEnabled: false,
} as const;

function matchesSearchTerm(value: string) {
  return value.trim().length >= 2;
}

function isShiftBlocked(shift: {
  shiftDate: Date;
  shiftBlocks: Array<{ startDate: Date; endDate: Date }>;
  zoneBlocks: Array<{ startDate: Date; endDate: Date }>;
}) {
  const target = toDateOnlyString(shift.shiftDate);

  return [...shift.shiftBlocks, ...shift.zoneBlocks].some((block) => {
    const start = toDateOnlyString(block.startDate);
    const end = toDateOnlyString(block.endDate);
    return target >= start && target <= end;
  });
}

const getCachedPublicConfigRecord = unstable_cache(
  async () =>
    prisma.systemConfig.findFirst({
      orderBy: { createdAt: "asc" },
    }),
  ["public-config"],
  {
    revalidate: 30,
  },
);

export const getPublicConfig = cache(async () => {
  const config = await getCachedPublicConfigRecord();

  return {
    ...DEFAULT_CONFIG,
    ...config,
    maxConfirmedPerWeek: EVENT.maxAssignmentsPerPerson ?? config?.maxConfirmedPerWeek ?? DEFAULT_CONFIG.maxConfirmedPerWeek,
  };
});

export const getCurrentPublicPerson = cache(async () => {
  const session = await getPublicSession();

  if (!session) {
    return null;
  }

  return prisma.person.findFirst({
    where: {
      id: session.personId,
      status: PersonStatus.ACTIVE,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      gender: true,
      status: true,
      phone: true,
      email: true,
    },
  });
});

const getCachedActivePeople = unstable_cache(
  async () =>
    prisma.person.findMany({
      where: {
        status: PersonStatus.ACTIVE,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),
  ["active-people"],
  {
    revalidate: 30,
  },
);

export async function listActivePeople() {
  return getCachedActivePeople();
}

const getCachedPublicZones = unstable_cache(
  async () =>
    prisma.zone.findMany({
      where: {
        status: "ACTIVE",
        publicVisible: true,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
  ["public-zones"],
  {
    revalidate: 30,
  },
);

export async function listPublicZonesForFlow() {
  return getCachedPublicZones();
}

export async function searchActivePeople(query: string) {
  if (!matchesSearchTerm(query)) {
    return [];
  }

  return prisma.person.findMany({
    where: {
      status: PersonStatus.ACTIVE,
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 12,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      pinLockedUntil: true,
    },
  });
}

async function getUncachedPublicShiftBoard(input: {
  currentPersonId?: string | null;
  zoneId?: string;
  from?: string;
  to?: string;
}) {
  const config = await getPublicConfig();
  const { from, to } = clampToEventDateRange(
    parseDateInput(input.from),
    parseDateInput(input.to),
  );

  const shifts = await prisma.shift.findMany({
    where: {
      shiftDate: {
        gte: from,
        lte: to,
      },
      zone: {
        status: "ACTIVE",
        publicVisible: true,
        ...(input.zoneId ? { id: input.zoneId } : {}),
      },
      status: {
        in: [ShiftStatus.OPEN, ShiftStatus.FULL, ShiftStatus.BLOCKED],
      },
    },
    orderBy: [
      { shiftDate: "asc" },
      { startTime: "asc" },
      { zone: { name: "asc" } },
    ],
    include: {
      zone: {
        select: {
          id: true,
          name: true,
          mapColor: true,
          blocks: {
            select: {
              startDate: true,
              endDate: true,
              reason: true,
            },
          },
        },
      },
      requests: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          personId: true,
          status: true,
          createdAt: true,
        },
      },
      assignments: {
        where: { status: AssignmentStatus.CONFIRMED },
        select: {
          id: true,
          status: true,
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
      blocks: {
        select: {
          startDate: true,
          endDate: true,
          reason: true,
        },
      },
    },
  });

  return shifts
    .map((shift) => {
      const blocked =
        shift.status === ShiftStatus.BLOCKED ||
        isShiftBlocked({
          shiftDate: shift.shiftDate,
          shiftBlocks: shift.blocks,
          zoneBlocks: shift.zone.blocks,
        });
      const ownLatestRequest = input.currentPersonId
        ? (shift.requests.find(
            (request) => request.personId === input.currentPersonId,
          ) ?? null)
        : null;
      const pendingCount = shift.requests.filter(
        (request) => request.status === ShiftRequestStatus.PENDING,
      ).length;

      return {
        id: shift.id,
        zoneId: shift.zone.id,
        zoneName: shift.zone.name,
        zoneColor: shift.zone.mapColor,
        shiftDate: shift.shiftDate,
        dateKey: toDateOnlyString(shift.shiftDate),
        dateLabel: formatDate(shift.shiftDate),
        fullDateLabel: formatLongDate(shift.shiftDate),
        startLabel: formatTime(shift.startTime),
        endLabel: formatTime(shift.endTime),
        status: shift.status,
        blocked,
        pendingCount,
        confirmedCount: shift.assignments.length,
        ownLatestRequest,
        publicAssignments: shift.assignments.map((assignment) => ({
          id: assignment.id,
          label: `${assignment.person1.firstName} ${assignment.person1.lastName} + ${assignment.person2.firstName} ${assignment.person2.lastName}`,
        })),
      };
    })
    .filter((shift) => {
      if (shift.blocked) {
        return false;
      }

      if (shift.status === ShiftStatus.OPEN) {
        return config.showOpenShiftsPublicly;
      }

      if (shift.status === ShiftStatus.FULL) {
        return config.showFullShiftsPublicly;
      }

      return false;
    });
}

export async function getOwnPendingRequests(personId: string) {
  return prisma.shiftRequest.findMany({
    where: {
      personId,
      status: ShiftRequestStatus.PENDING,
    },
    orderBy: [{ shift: { shiftDate: "asc" } }, { shift: { startTime: "asc" } }],
    select: {
      id: true,
      comments: true,
      suggestedPartner: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      shift: {
        select: {
          id: true,
          shiftDate: true,
          startTime: true,
          endTime: true,
          zone: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
}

const getCachedPublicShiftBoard = unstable_cache(
  async (currentPersonId: string, from: string, to: string) =>
    getUncachedPublicShiftBoard({
      currentPersonId: currentPersonId || null,
      from,
      to,
    }),
  ["public-shift-board"],
  { revalidate: 15 },
);

export async function getPublicShiftBoard(input: {
  currentPersonId?: string | null;
  zoneId?: string;
  from?: string;
  to?: string;
}) {
  const board = await getCachedPublicShiftBoard(
    input.currentPersonId ?? "",
    input.from ?? "",
    input.to ?? "",
  );

  return input.zoneId
    ? board.filter((shift) => shift.zoneId === input.zoneId)
    : board;
}

export async function getOwnConfirmedAssignments(
  personId: string,
  from: Date,
  to: Date,
) {
  return prisma.assignment.findMany({
    where: {
      status: AssignmentStatus.CONFIRMED,
      shift: {
        shiftDate: {
          gte: from,
          lte: to,
        },
      },
      OR: [{ person1Id: personId }, { person2Id: personId }],
    },
    orderBy: [{ shift: { shiftDate: "asc" } }, { shift: { startTime: "asc" } }],
    select: {
      id: true,
      shift: {
        select: {
          id: true,
          shiftDate: true,
          startTime: true,
          endTime: true,
          zone: {
            select: {
              name: true,
            },
          },
        },
      },
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
  });
}

export async function getPublicAssignmentsSnapshot(
  currentPersonId?: string | null,
) {
  const config = await getPublicConfig();
  const { from, to } = getEventDateRange();

  const [publicAssignments, publicRequests, ownAssignments, ownRequests] =
    await Promise.all([
      prisma.assignment.findMany({
        where: {
          status: AssignmentStatus.CONFIRMED,
          shift: {
            shiftDate: {
              gte: from,
              lte: to,
            },
            zone: {
              status: "ACTIVE",
              publicVisible: true,
            },
          },
        },
        orderBy: [
          { shift: { shiftDate: "asc" } },
          { shift: { startTime: "asc" } },
        ],
        select: {
          id: true,
          shift: {
            select: {
              shiftDate: true,
              startTime: true,
              endTime: true,
              zone: {
                select: {
                  name: true,
                },
              },
            },
          },
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
      }),
      config.showPendingRequestsPublicly
        ? prisma.shiftRequest.groupBy({
            by: ["shiftId"],
            where: {
              status: ShiftRequestStatus.PENDING,
              shift: {
                shiftDate: {
                  gte: from,
                  lte: to,
                },
                zone: {
                  status: "ACTIVE",
                  publicVisible: true,
                },
              },
            },
            _count: {
              _all: true,
            },
          })
        : Promise.resolve([]),
      currentPersonId
        ? prisma.assignment.findMany({
            where: {
              status: AssignmentStatus.CONFIRMED,
              OR: [
                { person1Id: currentPersonId },
                { person2Id: currentPersonId },
              ],
              shift: {
                shiftDate: { gte: from, lte: to },
              },
            },
            orderBy: [
              { shift: { shiftDate: "desc" } },
              { shift: { startTime: "desc" } },
            ],
            select: {
              id: true,
              person1Id: true,
              person2Id: true,
              shift: {
                select: {
                  shiftDate: true,
                  startTime: true,
                  endTime: true,
                  zone: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              person1: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                  notes: true,
                },
              },
              person2: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                  notes: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      currentPersonId
        ? prisma.shiftRequest.findMany({
            where: {
              personId: currentPersonId,
              shift: {
                shiftDate: { gte: from, lte: to },
              },
            },
            orderBy: [
              { shift: { shiftDate: "desc" } },
              { shift: { startTime: "desc" } },
            ],
            select: {
              id: true,
              status: true,
              comments: true,
              shift: {
                select: {
                  shiftDate: true,
                  startTime: true,
                  endTime: true,
                  zone: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              suggestedPartner: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

  return {
    config,
    publicAssignments: publicAssignments.map((item) => ({
      id: item.id,
      zoneName: item.shift.zone.name,
      dateLabel: formatDate(item.shift.shiftDate),
      timeLabel: `${formatTime(item.shift.startTime)} - ${formatTime(item.shift.endTime)}`,
      participants: config.showParticipantsPublicly
        ? `${item.person1.firstName} ${item.person1.lastName} + ${item.person2.firstName} ${item.person2.lastName}`
        : "Participacion confirmada",
    })),
    publicPendingByShift: publicRequests,
    ownAssignments: ownAssignments.map((item) => {
      const partner = item.person1Id === currentPersonId ? item.person2 : item.person1;

      return {
        id: item.id,
        zoneName: item.shift.zone.name,
        dateLabel: formatDate(item.shift.shiftDate),
        timeLabel: `${formatTime(item.shift.startTime)} - ${formatTime(item.shift.endTime)}`,
        partner: {
          name: `${partner.firstName} ${partner.lastName}`,
          phone: partner.phone,
        },
        congregationName: partner.notes,
      };
    }),
    ownRequests: ownRequests.map((item) => ({
      id: item.id,
      status: item.status,
      comments: item.comments,
      zoneName: item.shift.zone.name,
      dateLabel: formatDate(item.shift.shiftDate),
      timeLabel: `${formatTime(item.shift.startTime)} - ${formatTime(item.shift.endTime)}`,
      suggestedPartner: item.suggestedPartner
        ? `${item.suggestedPartner.firstName} ${item.suggestedPartner.lastName}`
        : null,
    })),
  };
}

export async function getSolicitarPageState(
  rawSearchParams: Promise<{ [key: string]: string | string[] | undefined }>,
) {
  const searchParams = await rawSearchParams;
  const personQuery = readFirstSearchParam(searchParams.personQuery).trim();
  const zoneId = readFirstSearchParam(searchParams.zoneId);
  const from = readFirstSearchParam(searchParams.from);
  const to = readFirstSearchParam(searchParams.to);
  const requestedScheduleView = readFirstSearchParam(searchParams.scheduleView);
  const requestedSelectedDate = readFirstSearchParam(searchParams.selectedDate);
  const selectedShiftId = readFirstSearchParam(searchParams.shiftId);

  const [config, currentPerson, zones] = await Promise.all([
    getPublicConfig(),
    getCurrentPublicPerson(),
    listPublicZonesForFlow(),
  ]);
  const people = currentPerson ? [] : await listActivePeople();

  const defaultRange = getEventDateRange();
  const scheduleView =
    requestedScheduleView === "confirmed" ||
    requestedScheduleView === "calendar"
      ? requestedScheduleView
      : "available";
  const parsedSelectedDate = parseDateInput(requestedSelectedDate);
  const selectedDate = parsedSelectedDate &&
    parsedSelectedDate >= defaultRange.from &&
    parsedSelectedDate <= defaultRange.to
      ? requestedSelectedDate
      : "";
  const boundedRange = clampToEventDateRange(
    parseDateInput(from),
    parseDateInput(to),
  );

  const shiftBoard = currentPerson
    ? await getPublicShiftBoard({
        currentPersonId: currentPerson.id,
        from: toDateOnlyString(boundedRange.from),
        to: toDateOnlyString(boundedRange.to),
      })
    : [];

  return {
    config,
    eventEnded: hasEventEnded(),
    currentPerson,
    people,
    zones,
    shiftBoard,
    filters: {
      personQuery,
      zoneId,
      from: toDateOnlyString(boundedRange.from),
      to: toDateOnlyString(boundedRange.to),
      selectedDate,
      selectedShiftId,
    },
    scheduleView,
    authError: readFirstSearchParam(searchParams.authError),
    notice: readFirstSearchParam(searchParams.notice),
    requestError: readFirstSearchParam(searchParams.requestError),
    sessionResetKey: readFirstSearchParam(searchParams.sessionReset),
  };
}

export async function getAsignacionesPageState(
  rawSearchParams: Promise<{ [key: string]: string | string[] | undefined }>,
) {
  const searchParams = await rawSearchParams;
  const currentPerson = await getCurrentPublicPerson();
  const snapshot = await getPublicAssignmentsSnapshot(currentPerson?.id);
  const assignmentNotices = currentPerson
    ? await prisma.assignment.findMany({
        where: {
          decidedByAdminId: { not: null },
          OR: [{ person1Id: currentPerson.id }, { person2Id: currentPerson.id }],
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: 30,
        select: {
          id: true,
          status: true,
          updatedAt: true,
          shift: { select: {
            shiftDate: true, startTime: true, endTime: true,
            zone: { select: { name: true } },
          } },
          person1: { select: { firstName: true, lastName: true } },
          person2: { select: { firstName: true, lastName: true } },
        },
      })
    : [];

  const people = currentPerson
    ? []
    : (await listActivePeople()).map((person) => ({
        id: person.id,
        label: `${person.firstName} ${person.lastName}`,
      }));

  return {
    currentPerson,
    people,
    notice: readFirstSearchParam(searchParams.notice),
    requestError: readFirstSearchParam(searchParams.requestError),
    assignmentNotices: assignmentNotices.map((item) => ({
      id: item.id,
      status: item.status,
      updatedLabel: new Intl.DateTimeFormat("es-CL", {
        dateStyle: "medium", timeStyle: "short", timeZone: "America/Santiago",
      }).format(item.updatedAt),
      zoneName: item.shift.zone.name,
      dateLabel: formatDate(item.shift.shiftDate),
      timeLabel: `${formatTime(item.shift.startTime)} - ${formatTime(item.shift.endTime)}`,
      pairLabel: `${item.person1.firstName} ${item.person1.lastName} + ${item.person2.firstName} ${item.person2.lastName}`,
    })),
    ...snapshot,
  };
}

export async function getAsignacionesCalendarPageState() {
  const currentPerson = await getCurrentPublicPerson();
  const { from, to } = getEventDateRange();

  const assignments = currentPerson
    ? await prisma.assignment.findMany({
        where: {
          status: AssignmentStatus.CONFIRMED,
          shift: {
            shiftDate: {
              gte: from,
              lte: to,
            },
            zone: {
              status: "ACTIVE",
              publicVisible: true,
            },
          },
        },
        orderBy: [
          { shift: { shiftDate: "asc" } },
          { shift: { startTime: "asc" } },
          { shift: { zone: { name: "asc" } } },
        ],
        select: {
          id: true,
          shift: {
            select: {
              shiftDate: true,
              startTime: true,
              endTime: true,
              zone: {
                select: {
                  name: true,
                },
              },
            },
          },
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
      })
    : [];

  return {
    currentPerson,
    range: {
      from,
      to,
      fromLabel: toDateOnlyString(from),
      toLabel: toDateOnlyString(to),
    },
    assignments: assignments.map((assignment) => ({
      id: assignment.id,
      dateKey: toDateOnlyString(assignment.shift.shiftDate),
      dateLabel: formatDate(assignment.shift.shiftDate),
      timeLabel: `${formatTime(assignment.shift.startTime)} - ${formatTime(assignment.shift.endTime)}`,
      zoneName: assignment.shift.zone.name,
      participantNames: [
        `${assignment.person1.firstName} ${assignment.person1.lastName}`,
        `${assignment.person2.firstName} ${assignment.person2.lastName}`,
      ],
    })),
  };
}
