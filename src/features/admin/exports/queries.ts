import { AssignmentStatus, ShiftRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime } from "@/features/admin/master-data/utils";
import { resolveStatsRange } from "@/features/admin/stats/utils";

export async function getAssignmentsExportRows(input: {
  from?: string | null | undefined;
  to?: string | null | undefined;
  zoneId?: string | null | undefined;
}) {
  const range = resolveStatsRange(input);

  const assignments = await prisma.assignment.findMany({
    where: {
      shift: {
        shiftDate: {
          gte: range.from,
          lte: range.to,
        },
        ...(input.zoneId ? { zoneId: input.zoneId } : {}),
      },
    },
    include: {
      shift: {
        include: {
          zone: { select: { name: true } },
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
    orderBy: [{ shift: { shiftDate: "asc" } }, { shift: { startTime: "asc" } }],
  });

  return assignments.map((assignment) => ({
    id: assignment.id,
    zone: assignment.shift.zone.name,
    fecha: formatDate(assignment.shift.shiftDate),
    horario: `${formatTime(assignment.shift.startTime)} - ${formatTime(assignment.shift.endTime)}`,
    estado: assignment.status,
    pareja: `${assignment.person1.firstName} ${assignment.person1.lastName} + ${assignment.person2.firstName} ${assignment.person2.lastName}`,
    excepcion: assignment.ruleExceptionUsed ? "Si" : "No",
    motivoExcepcion: assignment.exceptionReason ?? "",
  }));
}

export async function getRequestsExportRows(input: {
  from?: string | null | undefined;
  to?: string | null | undefined;
  zoneId?: string | null | undefined;
}) {
  const range = resolveStatsRange(input);

  const requests = await prisma.shiftRequest.findMany({
    where: {
      shift: {
        shiftDate: {
          gte: range.from,
          lte: range.to,
        },
        ...(input.zoneId ? { zoneId: input.zoneId } : {}),
      },
    },
    include: {
      shift: {
        include: {
          zone: { select: { name: true } },
        },
      },
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
    orderBy: [{ shift: { shiftDate: "asc" } }, { shift: { startTime: "asc" } }],
  });

  return requests.map((request) => ({
    id: request.id,
    zona: request.shift.zone.name,
    fecha: formatDate(request.shift.shiftDate),
    horario: `${formatTime(request.shift.startTime)} - ${formatTime(request.shift.endTime)}`,
    persona: `${request.person.firstName} ${request.person.lastName}`,
    estado: request.status,
    parejaSugerida: request.suggestedPartner
      ? `${request.suggestedPartner.firstName} ${request.suggestedPartner.lastName}`
      : "",
    comentario: request.comments ?? "",
  }));
}

export async function getExportsPageState(rawSearchParams: Promise<{ [key: string]: string | string[] | undefined }>) {
  const searchParams = await rawSearchParams;
  const zoneId = Array.isArray(searchParams.zoneId) ? searchParams.zoneId[0] : searchParams.zoneId ?? "";
  const range = resolveStatsRange({
    from: Array.isArray(searchParams.from) ? searchParams.from[0] : searchParams.from,
    to: Array.isArray(searchParams.to) ? searchParams.to[0] : searchParams.to,
  });

  const [zones, assignmentCount, requestCount, pendingCount, confirmedCount] = await Promise.all([
    prisma.zone.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.assignment.count({
      where: {
        shift: {
          shiftDate: {
            gte: range.from,
            lte: range.to,
          },
          ...(zoneId ? { zoneId } : {}),
        },
      },
    }),
    prisma.shiftRequest.count({
      where: {
        shift: {
          shiftDate: {
            gte: range.from,
            lte: range.to,
          },
          ...(zoneId ? { zoneId } : {}),
        },
      },
    }),
    prisma.shiftRequest.count({
      where: {
        status: ShiftRequestStatus.PENDING,
        shift: {
          shiftDate: {
            gte: range.from,
            lte: range.to,
          },
          ...(zoneId ? { zoneId } : {}),
        },
      },
    }),
    prisma.assignment.count({
      where: {
        status: AssignmentStatus.CONFIRMED,
        shift: {
          shiftDate: {
            gte: range.from,
            lte: range.to,
          },
          ...(zoneId ? { zoneId } : {}),
        },
      },
    }),
  ]);

  return {
    zones,
    filters: {
      zoneId,
      from: range.fromValue,
      to: range.toValue,
    },
    summary: {
      assignmentCount,
      requestCount,
      pendingCount,
      confirmedCount,
    },
  };
}
