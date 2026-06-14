import {
  AssignmentStatus,
  PersonStatus,
  RelationshipType,
  ShiftRequestStatus,
  ShiftStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPublicSession } from "@/features/public/session";
import {
  buildVisibleDateRange,
  formatDate,
  formatTime,
  getHistoryCutoffDate,
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
  maxRequestsPerWeek: 4,
  maxConfirmedPerWeek: 2,
  maxConfirmedPerMonth: 6,
  allowConsecutiveDays: false,
  allowMultiplePerDay: false,
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

export async function getPublicConfig() {
  const config = await prisma.systemConfig.findFirst({
    orderBy: { createdAt: "asc" },
  });

  return {
    ...DEFAULT_CONFIG,
    ...config,
  };
}

export async function getCurrentPublicPerson() {
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
      failedPinAttempts: true,
      pinLockedUntil: true,
    },
  });
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

export async function listActivePeople() {
  return prisma.person.findMany({
    where: {
      status: PersonStatus.ACTIVE,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      pinLockedUntil: true,
    },
  });
}

export async function getSelectedPerson(personId: string) {
  if (!personId) {
    return null;
  }

  return prisma.person.findFirst({
    where: {
      id: personId,
      status: PersonStatus.ACTIVE,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      pinLockedUntil: true,
    },
  });
}

export async function getSuggestedPartners(personId: string) {
  const [config, currentPerson, candidates, relationships] = await Promise.all([
    getPublicConfig(),
    prisma.person.findUnique({
      where: { id: personId },
      select: { id: true, gender: true },
    }),
    prisma.person.findMany({
      where: {
        status: PersonStatus.ACTIVE,
        id: { not: personId },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
      },
    }),
    prisma.relationship.findMany({
      where: {
        OR: [{ personAId: personId }, { personBId: personId }],
      },
      select: {
        personAId: true,
        personBId: true,
        type: true,
      },
    }),
  ]);

  if (!currentPerson) {
    return [];
  }

  return candidates
    .filter((candidate) => {
      const sameGenderAllowed =
        config.allowSameSexPairing && candidate.gender === currentPerson.gender;
      const hasRelationship = relationships.some((relationship) => {
        const matchesPair =
          (relationship.personAId === currentPerson.id &&
            relationship.personBId === candidate.id) ||
          (relationship.personBId === currentPerson.id &&
            relationship.personAId === candidate.id);

        return (
          matchesPair &&
          [
            RelationshipType.MARRIAGE,
            RelationshipType.PARENT_CHILD,
            RelationshipType.ADMIN_EXCEPTION,
          ].includes(relationship.type)
        );
      });

      return sameGenderAllowed || hasRelationship;
    })
    .map((candidate) => ({
      id: candidate.id,
      label: `${candidate.firstName} ${candidate.lastName}`,
    }));
}

export async function getPublicShiftBoard(input: {
  currentPersonId?: string | null;
  zoneId?: string;
  from?: string;
  to?: string;
}) {
  const config = await getPublicConfig();
  const defaultRange = buildVisibleDateRange(config.visibleWeeks);
  const from = parseDateInput(input.from) ?? defaultRange.from;
  const to = parseDateInput(input.to) ?? defaultRange.to;

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
        shiftDate: shift.shiftDate,
        dateLabel: formatDate(shift.shiftDate),
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
  const { from, to } = buildVisibleDateRange(config.visibleWeeks);
  const historyCutoff = getHistoryCutoffDate(config.historyVisibility);

  const [publicAssignments, publicRequests, ownAssignments, ownRequests] =
    await Promise.all([
      prisma.assignment.findMany({
        where: {
          status: AssignmentStatus.CONFIRMED,
          shift: {
            shiftDate: {
              gte:
                config.showHistoryPublicly && historyCutoff
                  ? historyCutoff
                  : from,
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
              ...(historyCutoff
                ? {
                    shift: {
                      shiftDate: {
                        gte: historyCutoff,
                      },
                    },
                  }
                : {}),
            },
            orderBy: [
              { shift: { shiftDate: "desc" } },
              { shift: { startTime: "desc" } },
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
        : Promise.resolve([]),
      currentPersonId
        ? prisma.shiftRequest.findMany({
            where: {
              personId: currentPersonId,
              ...(historyCutoff
                ? {
                    createdAt: {
                      gte: historyCutoff,
                    },
                  }
                : {}),
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
    ownAssignments: ownAssignments.map((item) => ({
      id: item.id,
      zoneName: item.shift.zone.name,
      dateLabel: formatDate(item.shift.shiftDate),
      timeLabel: `${formatTime(item.shift.startTime)} - ${formatTime(item.shift.endTime)}`,
      pairLabel: `${item.person1.firstName} ${item.person1.lastName} + ${item.person2.firstName} ${item.person2.lastName}`,
    })),
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
  const selectedPersonId = readFirstSearchParam(searchParams.selectedPersonId);
  const zoneId = readFirstSearchParam(searchParams.zoneId);
  const from = readFirstSearchParam(searchParams.from);
  const to = readFirstSearchParam(searchParams.to);
  const requestedScheduleView = readFirstSearchParam(searchParams.scheduleView);
  const requestedSelectedDate = readFirstSearchParam(searchParams.selectedDate);

  const [config, currentPerson, people, selectedPerson] = await Promise.all([
    getPublicConfig(),
    getCurrentPublicPerson(),
    listActivePeople(),
    getSelectedPerson(selectedPersonId),
  ]);

  const defaultRange = buildVisibleDateRange(config.visibleWeeks);
  const resolvedFrom = parseDateInput(from) ?? defaultRange.from;
  const resolvedTo = parseDateInput(to) ?? defaultRange.to;
  const scheduleView =
    requestedScheduleView === "confirmed" ||
    requestedScheduleView === "calendar"
      ? requestedScheduleView
      : "available";
  const selectedDate = parseDateInput(requestedSelectedDate)
    ? requestedSelectedDate
    : "";

  const [
    shiftBoard,
    partnerOptions,
    ownPendingRequests,
    ownConfirmedAssignments,
  ] = currentPerson
    ? await Promise.all([
        getPublicShiftBoard({
          currentPersonId: currentPerson.id,
          zoneId,
          from,
          to,
        }),
        getSuggestedPartners(currentPerson.id),
        getOwnPendingRequests(currentPerson.id),
        getOwnConfirmedAssignments(currentPerson.id, resolvedFrom, resolvedTo),
      ])
    : [[], [], [], []];

  const zones = await prisma.zone.findMany({
    where: {
      status: "ACTIVE",
      publicVisible: true,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });
  return {
    config,
    currentPerson,
    people,
    selectedPerson,
    zones,
    shiftBoard,
    partnerOptions,
    ownPendingRequests,
    ownConfirmedAssignments: ownConfirmedAssignments.map((assignment) => ({
      id: assignment.id,
      shiftId: assignment.shift.id,
      zoneName: assignment.shift.zone.name,
      shiftDate: assignment.shift.shiftDate,
      startTime: assignment.shift.startTime,
      endTime: assignment.shift.endTime,
      dateLabel: formatDate(assignment.shift.shiftDate),
      timeLabel: `${formatTime(assignment.shift.startTime)} - ${formatTime(assignment.shift.endTime)}`,
      pairLabel: `${assignment.person1.firstName} ${assignment.person1.lastName} + ${assignment.person2.firstName} ${assignment.person2.lastName}`,
    })),
    filters: {
      personQuery,
      zoneId,
      from: from || toDateOnlyString(defaultRange.from),
      to: to || toDateOnlyString(defaultRange.to),
      selectedDate,
    },
    scheduleView,
    authError: readFirstSearchParam(searchParams.authError),
    notice: readFirstSearchParam(searchParams.notice),
    requestError: readFirstSearchParam(searchParams.requestError),
  };
}

export async function getAsignacionesPageState() {
  const currentPerson = await getCurrentPublicPerson();
  const snapshot = await getPublicAssignmentsSnapshot(currentPerson?.id);

  return {
    currentPerson,
    ...snapshot,
  };
}

export async function getAsignacionesCalendarPageState() {
  const [config, currentPerson] = await Promise.all([
    getPublicConfig(),
    getCurrentPublicPerson(),
  ]);
  const { from, to } = buildVisibleDateRange(config.visibleWeeks);

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
