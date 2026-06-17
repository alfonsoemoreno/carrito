"use server";

import {
  AssignmentStatus,
  PersonStatus,
  RelationshipType,
  ShiftRequestStatus,
  ShiftStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  clearPublicSession,
  getPublicSession,
} from "@/features/public/session";
import {
  getWeekKey,
  isConsecutiveUtcDate,
  isSameUtcDate,
  overlapsTimeRange,
  toDateOnlyString,
} from "@/features/public/utils";

function buildRedirect(
  path: string,
  params: Record<string, string | null | undefined>,
) {
  const url = new URL(path, "http://localhost");

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

function redirectTo(path: string): never {
  redirect(path as never);
}

async function requireSessionPerson() {
  const session = await getPublicSession();

  if (!session?.personId) {
    throw new Error("Debes seleccionar tu nombre para continuar.");
  }

  const person = await prisma.person.findFirst({
    where: {
      id: session.personId,
      status: PersonStatus.ACTIVE,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      gender: true,
    },
  });

  if (!person) {
    await clearPublicSession();
    throw new Error("La sesion publica ya no es valida.");
  }

  return person;
}

async function isValidSuggestedPartner(
  personId: string,
  partnerId: string,
  allowSameSexPairing: boolean,
) {
  const [person, partner, relationships] = await Promise.all([
    prisma.person.findUnique({
      where: { id: personId },
      select: { id: true, gender: true, status: true },
    }),
    prisma.person.findUnique({
      where: { id: partnerId },
      select: { id: true, gender: true, status: true },
    }),
    prisma.relationship.findMany({
      where: {
        OR: [
          { personAId: personId, personBId: partnerId },
          { personAId: partnerId, personBId: personId },
        ],
      },
      select: {
        type: true,
      },
    }),
  ]);

  if (
    !person ||
    !partner ||
    partner.status !== PersonStatus.ACTIVE ||
    person.id === partner.id
  ) {
    return false;
  }

  if (allowSameSexPairing && person.gender === partner.gender) {
    return true;
  }

  return relationships.some((relationship) =>
    [
      RelationshipType.MARRIAGE,
      RelationshipType.PARENT_CHILD,
      RelationshipType.ADMIN_EXCEPTION,
    ].includes(relationship.type),
  );
}

export async function logoutPublicPersonAction() {
  await clearPublicSession();
  redirectTo("/solicitar?notice=Sesion%20cerrada.");
}

export async function submitShiftRequestsAction(formData: FormData) {
  const currentPerson = await requireSessionPerson();
  const returnTo = String(formData.get("returnTo") ?? "/solicitar");
  const selectedShiftIds = formData
    .getAll("shiftIds")
    .map((value) => String(value))
    .filter(Boolean);
  const suggestedPartnerId = String(formData.get("suggestedPartnerId") ?? "");
  const comments = String(formData.get("comments") ?? "").trim();
  const redirectWithRequestError = (message: string): never =>
    redirectTo(buildRedirect(returnTo, { requestError: message }));

  if (selectedShiftIds.length === 0) {
    redirectWithRequestError("Selecciona al menos un turno.");
  }

  const config = await prisma.systemConfig.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      maxRequestsPerWeek: true,
      allowConsecutiveDays: true,
      allowMultiplePerDay: true,
      allowOverlapping: true,
      allowSameSexPairing: true,
    },
  });

  const policy = {
    maxRequestsPerWeek: config?.maxRequestsPerWeek ?? 4,
    allowConsecutiveDays: config?.allowConsecutiveDays ?? false,
    allowMultiplePerDay: config?.allowMultiplePerDay ?? false,
    allowOverlapping: config?.allowOverlapping ?? false,
    allowSameSexPairing: config?.allowSameSexPairing ?? true,
  };

  if (
    suggestedPartnerId &&
    !(await isValidSuggestedPartner(
      currentPerson.id,
      suggestedPartnerId,
      policy.allowSameSexPairing,
    ))
  ) {
    redirectWithRequestError(
      "La pareja sugerida no cumple las reglas vigentes.",
    );
  }

  const shifts = await prisma.shift.findMany({
    where: {
      id: {
        in: selectedShiftIds,
      },
    },
    include: {
      zone: {
        select: {
          id: true,
          name: true,
          status: true,
          publicVisible: true,
          blocks: {
            select: {
              startDate: true,
              endDate: true,
            },
          },
        },
      },
      blocks: {
        select: {
          startDate: true,
          endDate: true,
        },
      },
      requests: {
        where: {
          personId: currentPerson.id,
          status: {
            in: [ShiftRequestStatus.PENDING, ShiftRequestStatus.CONFIRMED],
          },
        },
        select: {
          id: true,
          shiftId: true,
          status: true,
        },
      },
      assignments: {
        where: {
          status: AssignmentStatus.CONFIRMED,
          OR: [
            { person1Id: currentPerson.id },
            { person2Id: currentPerson.id },
          ],
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (shifts.length !== selectedShiftIds.length) {
    redirectWithRequestError("Uno o mas turnos ya no estan disponibles.");
  }

  const rangeStart = new Date();
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 1);

  const [availabilityBlocks, existingRequests, existingAssignments] =
    await Promise.all([
      prisma.availabilityException.findMany({
        where: {
          personId: currentPerson.id,
        },
        select: {
          startDate: true,
          endDate: true,
        },
      }),
      prisma.shiftRequest.findMany({
        where: {
          personId: currentPerson.id,
          status: {
            in: [ShiftRequestStatus.PENDING, ShiftRequestStatus.CONFIRMED],
          },
          shift: {
            shiftDate: {
              gte: rangeStart,
            },
          },
        },
        select: {
          shiftId: true,
          shift: {
            select: {
              shiftDate: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      }),
      prisma.assignment.findMany({
        where: {
          status: AssignmentStatus.CONFIRMED,
          OR: [
            { person1Id: currentPerson.id },
            { person2Id: currentPerson.id },
          ],
          shift: {
            shiftDate: {
              gte: rangeStart,
            },
          },
        },
        select: {
          shiftId: true,
          shift: {
            select: {
              shiftDate: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      }),
    ]);

  const weeklyCounts = new Map<string, number>();
  for (const request of existingRequests) {
    const key = getWeekKey(request.shift.shiftDate);
    weeklyCounts.set(key, (weeklyCounts.get(key) ?? 0) + 1);
  }

  const selectedDates = new Map<
    string,
    { shiftDate: Date; startTime: Date; endTime: Date }[]
  >();

  for (const shift of shifts) {
    if (
      shift.status !== ShiftStatus.OPEN ||
      shift.zone.status !== "ACTIVE" ||
      !shift.zone.publicVisible
    ) {
      redirectWithRequestError(
        "Solo puedes solicitar turnos publicos y abiertos.",
      );
    }

    const blockedByAvailability = availabilityBlocks.some((block) => {
      const target = toDateOnlyString(shift.shiftDate);
      return (
        target >= toDateOnlyString(block.startDate) &&
        target <= toDateOnlyString(block.endDate)
      );
    });

    if (blockedByAvailability) {
      redirectWithRequestError(
        "Tienes una indisponibilidad registrada para uno de los turnos seleccionados.",
      );
    }

    const blockedByShift = [...shift.blocks, ...shift.zone.blocks].some(
      (block) => {
        const target = toDateOnlyString(shift.shiftDate);
        return (
          target >= toDateOnlyString(block.startDate) &&
          target <= toDateOnlyString(block.endDate)
        );
      },
    );

    if (blockedByShift) {
      redirectWithRequestError(
        "Uno de los turnos seleccionados quedo bloqueado.",
      );
    }

    if (shift.requests.length > 0 || shift.assignments.length > 0) {
      redirectWithRequestError(
        "Ya existe una solicitud activa o asignacion para ese turno.",
      );
    }

    const weekKey = getWeekKey(shift.shiftDate);
    const nextWeeklyCount = (weeklyCounts.get(weekKey) ?? 0) + 1;

    if (nextWeeklyCount > policy.maxRequestsPerWeek) {
      redirectWithRequestError(
        "La seleccion supera el maximo de solicitudes por semana.",
      );
    }

    weeklyCounts.set(weekKey, nextWeeklyCount);

    const currentDateKey = toDateOnlyString(shift.shiftDate);
    const sameDaySelected = selectedDates.get(currentDateKey) ?? [];

    if (!policy.allowMultiplePerDay && sameDaySelected.length > 0) {
      redirectWithRequestError(
        "La configuracion actual no permite mas de un turno por dia.",
      );
    }

    for (const request of existingRequests) {
      if (
        !policy.allowMultiplePerDay &&
        isSameUtcDate(request.shift.shiftDate, shift.shiftDate)
      ) {
        redirectWithRequestError(
          "Ya tienes una solicitud activa para ese dia.",
        );
      }

      if (
        !policy.allowConsecutiveDays &&
        isConsecutiveUtcDate(request.shift.shiftDate, shift.shiftDate)
      ) {
        redirectWithRequestError(
          "La configuracion actual bloquea dias consecutivos.",
        );
      }

      if (
        !policy.allowOverlapping &&
        isSameUtcDate(request.shift.shiftDate, shift.shiftDate) &&
        overlapsTimeRange(
          request.shift.startTime,
          request.shift.endTime,
          shift.startTime,
          shift.endTime,
        )
      ) {
        redirectWithRequestError(
          "Uno de los turnos se superpone con otra solicitud tuya.",
        );
      }
    }

    for (const assignment of existingAssignments) {
      if (
        !policy.allowMultiplePerDay &&
        isSameUtcDate(assignment.shift.shiftDate, shift.shiftDate)
      ) {
        redirectWithRequestError(
          "Ya tienes una asignacion confirmada para ese dia.",
        );
      }

      if (
        !policy.allowConsecutiveDays &&
        isConsecutiveUtcDate(assignment.shift.shiftDate, shift.shiftDate)
      ) {
        redirectWithRequestError(
          "La configuracion actual bloquea dias consecutivos.",
        );
      }

      if (
        !policy.allowOverlapping &&
        isSameUtcDate(assignment.shift.shiftDate, shift.shiftDate) &&
        overlapsTimeRange(
          assignment.shift.startTime,
          assignment.shift.endTime,
          shift.startTime,
          shift.endTime,
        )
      ) {
        redirectWithRequestError(
          "Uno de los turnos se superpone con otra asignacion tuya.",
        );
      }
    }

    for (const otherDay of selectedDates.values()) {
      for (const other of otherDay) {
        if (
          !policy.allowConsecutiveDays &&
          isConsecutiveUtcDate(other.shiftDate, shift.shiftDate)
        ) {
          redirectWithRequestError(
            "La seleccion incluye dias consecutivos no permitidos.",
          );
        }

        if (
          !policy.allowOverlapping &&
          isSameUtcDate(other.shiftDate, shift.shiftDate) &&
          overlapsTimeRange(
            other.startTime,
            other.endTime,
            shift.startTime,
            shift.endTime,
          )
        ) {
          redirectWithRequestError("La seleccion incluye turnos superpuestos.");
        }
      }
    }

    sameDaySelected.push({
      shiftDate: shift.shiftDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
    });
    selectedDates.set(currentDateKey, sameDaySelected);
  }

  await prisma.$transaction(async (tx) => {
    for (const shift of shifts) {
      const created = await tx.shiftRequest.create({
        data: {
          shiftId: shift.id,
          personId: currentPerson.id,
          suggestedPartnerId: suggestedPartnerId || null,
          comments: comments || null,
          status: ShiftRequestStatus.PENDING,
        },
      });

      await tx.auditLog.create({
        data: {
          actorType: "PUBLIC_PERSON",
          entityType: "shift_request",
          entityId: created.id,
          actorPersonId: currentPerson.id,
          action: "PUBLIC_REQUEST_CREATED",
          afterData: {
            shiftId: shift.id,
            suggestedPartnerId: suggestedPartnerId || null,
          },
        },
      });
    }
  });

  revalidatePath("/solicitar");
  revalidatePath("/asignaciones");
  redirectTo(
    buildRedirect(returnTo, {
      notice: `Se registraron ${selectedShiftIds.length} solicitudes pendientes.`,
    }),
  );
}

export async function cancelOwnPendingRequestAction(formData: FormData) {
  const currentPerson = await requireSessionPerson();
  const requestId = String(formData.get("requestId") ?? "");

  if (!requestId) {
    redirectTo(
      "/solicitar?requestError=No%20se%20indico%20la%20solicitud%20a%20cancelar.",
    );
  }

  const request = await prisma.shiftRequest.findFirst({
    where: {
      id: requestId,
      personId: currentPerson.id,
      status: ShiftRequestStatus.PENDING,
    },
    select: {
      id: true,
    },
  });

  if (!request) {
    redirectTo(
      "/solicitar?requestError=La%20solicitud%20ya%20no%20puede%20cancelarse.",
    );
  }

  await prisma.$transaction([
    prisma.shiftRequest.update({
      where: { id: request.id },
      data: {
        status: ShiftRequestStatus.CANCELLED,
        cancelledAt: new Date(),
        resolvedAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        actorType: "PUBLIC_PERSON",
        entityType: "shift_request",
        entityId: request.id,
        actorPersonId: currentPerson.id,
        action: "PUBLIC_REQUEST_CANCELLED",
      },
    }),
  ]);

  revalidatePath("/solicitar");
  revalidatePath("/asignaciones");
  redirectTo("/solicitar?notice=Solicitud%20cancelada.");
}
