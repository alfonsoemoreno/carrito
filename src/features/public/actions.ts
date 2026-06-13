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
import { verifyPin } from "@/lib/pin";
import { clearPublicSession, createPublicSession, getPublicSession } from "@/features/public/session";
import {
  getWeekKey,
  isConsecutiveUtcDate,
  isSameUtcDate,
  overlapsTimeRange,
  toDateOnlyString,
} from "@/features/public/utils";

function buildRedirect(path: string, params: Record<string, string | null | undefined>) {
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
    throw new Error("Debes validar tu PIN para continuar.");
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

async function isValidSuggestedPartner(personId: string, partnerId: string, allowSameSexPairing: boolean) {
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

  if (!person || !partner || partner.status !== PersonStatus.ACTIVE || person.id === partner.id) {
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

export async function authenticatePublicPersonAction(formData: FormData) {
  const personId = String(formData.get("personId") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/solicitar");

  if (!personId) {
    redirectTo(
      buildRedirect(returnTo, {
        authError: "Selecciona una persona antes de ingresar el PIN.",
      }),
    );
  }

  const config = await prisma.systemConfig.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      pinMinLength: true,
      pinMaxLength: true,
      pinMaxAttempts: true,
      pinLockMinutes: true,
    },
  });

  const policy = {
    pinMinLength: config?.pinMinLength ?? 4,
    pinMaxLength: config?.pinMaxLength ?? 8,
    pinMaxAttempts: config?.pinMaxAttempts ?? 5,
    pinLockMinutes: config?.pinLockMinutes ?? 15,
  };

  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      status: PersonStatus.ACTIVE,
    },
  });

  if (!person) {
    redirectTo(
      buildRedirect(returnTo, {
        authError: "La persona seleccionada ya no esta disponible.",
      }),
    );
  }

  if (pin.length < policy.pinMinLength || pin.length > policy.pinMaxLength) {
    redirectTo(
      buildRedirect(returnTo, {
        selectedPersonId: personId,
        authError: `El PIN debe tener entre ${policy.pinMinLength} y ${policy.pinMaxLength} digitos.`,
      }),
    );
  }

  if (person.pinLockedUntil && person.pinLockedUntil > new Date()) {
    redirectTo(
      buildRedirect(returnTo, {
        selectedPersonId: personId,
        authError: "El PIN esta bloqueado temporalmente. Intenta mas tarde.",
      }),
    );
  }

  const validPin = verifyPin(pin, person.pinHash);

  if (!validPin) {
    const nextAttempts = person.failedPinAttempts + 1;
    const shouldLock = nextAttempts >= policy.pinMaxAttempts;

    await prisma.person.update({
      where: { id: person.id },
      data: {
        failedPinAttempts: shouldLock ? 0 : nextAttempts,
        pinLockedUntil: shouldLock
          ? new Date(Date.now() + policy.pinLockMinutes * 60 * 1000)
          : null,
      },
    });

    redirectTo(
      buildRedirect(returnTo, {
        selectedPersonId: personId,
        authError: shouldLock
          ? "Se alcanzo el maximo de intentos. El PIN quedo bloqueado temporalmente."
          : "El PIN ingresado no coincide.",
      }),
    );
  }

  await prisma.person.update({
    where: { id: person.id },
    data: {
      failedPinAttempts: 0,
      pinLockedUntil: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "PUBLIC_PERSON",
      entityType: "public_session",
      entityId: person.id,
      actorPersonId: person.id,
      action: "PIN_AUTHENTICATED",
      afterData: {
        at: new Date().toISOString(),
      },
    },
  });

  await createPublicSession(person.id);
  redirectTo(buildRedirect(returnTo, { notice: "PIN validado correctamente." }));
}

export async function logoutPublicPersonAction() {
  const session = await getPublicSession();

  if (session?.personId) {
    await prisma.auditLog.create({
      data: {
        actorType: "PUBLIC_PERSON",
        entityType: "public_session",
        entityId: session.personId,
        actorPersonId: session.personId,
        action: "PUBLIC_SESSION_CLOSED",
      },
    });
  }

  await clearPublicSession();
  redirectTo("/solicitar?notice=Sesion%20cerrada.");
}

export async function submitShiftRequestsAction(formData: FormData) {
  const currentPerson = await requireSessionPerson();
  const selectedShiftIds = formData
    .getAll("shiftIds")
    .map((value) => String(value))
    .filter(Boolean);
  const suggestedPartnerId = String(formData.get("suggestedPartnerId") ?? "");
  const comments = String(formData.get("comments") ?? "").trim();

  if (selectedShiftIds.length === 0) {
    redirectTo("/solicitar?requestError=Selecciona%20al%20menos%20un%20turno.");
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
    redirectTo("/solicitar?requestError=La%20pareja%20sugerida%20no%20cumple%20las%20reglas%20vigentes.");
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
          OR: [{ person1Id: currentPerson.id }, { person2Id: currentPerson.id }],
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (shifts.length !== selectedShiftIds.length) {
    redirectTo("/solicitar?requestError=Uno%20o%20mas%20turnos%20ya%20no%20estan%20disponibles.");
  }

  const rangeStart = new Date();
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 1);

  const [availabilityBlocks, existingRequests, existingAssignments] = await Promise.all([
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
        OR: [{ person1Id: currentPerson.id }, { person2Id: currentPerson.id }],
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

  const selectedDates = new Map<string, { shiftDate: Date; startTime: Date; endTime: Date }[]>();

  for (const shift of shifts) {
    if (
      shift.status !== ShiftStatus.OPEN ||
      shift.zone.status !== "ACTIVE" ||
      !shift.zone.publicVisible
    ) {
      redirectTo("/solicitar?requestError=Solo%20puedes%20solicitar%20turnos%20publicos%20y%20abiertos.");
    }

    const blockedByAvailability = availabilityBlocks.some((block) => {
      const target = toDateOnlyString(shift.shiftDate);
      return target >= toDateOnlyString(block.startDate) && target <= toDateOnlyString(block.endDate);
    });

    if (blockedByAvailability) {
      redirectTo("/solicitar?requestError=Tienes%20una%20indisponibilidad%20registrada%20para%20uno%20de%20los%20turnos%20seleccionados.");
    }

    const blockedByShift = [...shift.blocks, ...shift.zone.blocks].some((block) => {
      const target = toDateOnlyString(shift.shiftDate);
      return target >= toDateOnlyString(block.startDate) && target <= toDateOnlyString(block.endDate);
    });

    if (blockedByShift) {
      redirectTo("/solicitar?requestError=Uno%20de%20los%20turnos%20seleccionados%20quedo%20bloqueado.");
    }

    if (shift.requests.length > 0 || shift.assignments.length > 0) {
      redirectTo("/solicitar?requestError=Ya%20existe%20una%20solicitud%20activa%20o%20asignacion%20para%20ese%20turno.");
    }

    const weekKey = getWeekKey(shift.shiftDate);
    const nextWeeklyCount = (weeklyCounts.get(weekKey) ?? 0) + 1;

    if (nextWeeklyCount > policy.maxRequestsPerWeek) {
      redirectTo("/solicitar?requestError=La%20seleccion%20supera%20el%20maximo%20de%20solicitudes%20por%20semana.");
    }

    weeklyCounts.set(weekKey, nextWeeklyCount);

    const currentDateKey = toDateOnlyString(shift.shiftDate);
    const sameDaySelected = selectedDates.get(currentDateKey) ?? [];

    if (!policy.allowMultiplePerDay && sameDaySelected.length > 0) {
      redirectTo("/solicitar?requestError=La%20configuracion%20actual%20no%20permite%20mas%20de%20un%20turno%20por%20dia.");
    }

    for (const request of existingRequests) {
      if (
        !policy.allowMultiplePerDay &&
        isSameUtcDate(request.shift.shiftDate, shift.shiftDate)
      ) {
        redirectTo("/solicitar?requestError=Ya%20tienes%20una%20solicitud%20activa%20para%20ese%20dia.");
      }

      if (
        !policy.allowConsecutiveDays &&
        isConsecutiveUtcDate(request.shift.shiftDate, shift.shiftDate)
      ) {
        redirectTo("/solicitar?requestError=La%20configuracion%20actual%20bloquea%20dias%20consecutivos.");
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
        redirectTo("/solicitar?requestError=Uno%20de%20los%20turnos%20se%20superpone%20con%20otra%20solicitud%20tuya.");
      }
    }

    for (const assignment of existingAssignments) {
      if (
        !policy.allowMultiplePerDay &&
        isSameUtcDate(assignment.shift.shiftDate, shift.shiftDate)
      ) {
        redirectTo("/solicitar?requestError=Ya%20tienes%20una%20asignacion%20confirmada%20para%20ese%20dia.");
      }

      if (
        !policy.allowConsecutiveDays &&
        isConsecutiveUtcDate(assignment.shift.shiftDate, shift.shiftDate)
      ) {
        redirectTo("/solicitar?requestError=La%20configuracion%20actual%20bloquea%20dias%20consecutivos.");
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
        redirectTo("/solicitar?requestError=Uno%20de%20los%20turnos%20se%20superpone%20con%20otra%20asignacion%20tuya.");
      }
    }

    for (const otherDay of selectedDates.values()) {
      for (const other of otherDay) {
        if (!policy.allowConsecutiveDays && isConsecutiveUtcDate(other.shiftDate, shift.shiftDate)) {
          redirectTo("/solicitar?requestError=La%20seleccion%20incluye%20dias%20consecutivos%20no%20permitidos.");
        }

        if (
          !policy.allowOverlapping &&
          isSameUtcDate(other.shiftDate, shift.shiftDate) &&
          overlapsTimeRange(other.startTime, other.endTime, shift.startTime, shift.endTime)
        ) {
          redirectTo("/solicitar?requestError=La%20seleccion%20incluye%20turnos%20superpuestos.");
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
  redirectTo(`/solicitar?notice=Se%20registraron%20${selectedShiftIds.length}%20solicitudes%20pendientes.`);
}

export async function cancelOwnPendingRequestAction(formData: FormData) {
  const currentPerson = await requireSessionPerson();
  const requestId = String(formData.get("requestId") ?? "");

  if (!requestId) {
    redirectTo("/solicitar?requestError=No%20se%20indico%20la%20solicitud%20a%20cancelar.");
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
    redirectTo("/solicitar?requestError=La%20solicitud%20ya%20no%20puede%20cancelarse.");
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
