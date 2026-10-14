"use server";

import {
  AssignmentStatus,
  PersonStatus,
  ShiftRequestStatus,
  ShiftStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  clearPublicSession,
  createPublicSession,
  getPublicSession,
} from "@/features/public/session";
import { getEventDateRange, hasEventEnded } from "@/lib/event";
import {
  getPublicConfig,
  getPublicShiftBoard,
  listPublicZonesForFlow,
} from "@/features/public/queries";
import { toDateOnlyString } from "@/features/public/utils";

export async function startPublicSessionAction(personId: string) {
  const person = await prisma.person.findFirst({
    where: { id: personId, status: PersonStatus.ACTIVE },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!person) {
    return { ok: false as const, message: "La persona seleccionada ya no está disponible." };
  }

  await createPublicSession(person.id);
  await prisma.auditLog.create({
    data: {
      actorType: "PUBLIC_PERSON",
      entityType: "public_session",
      entityId: person.id,
      actorPersonId: person.id,
      action: "PUBLIC_SESSION_STARTED",
      afterData: { at: new Date().toISOString() },
    },
  });

  const config = await getPublicConfig();
  const range = getEventDateRange();
  const from = toDateOnlyString(range.from);
  const to = toDateOnlyString(range.to);
  const [zones, shifts] = await Promise.all([
    listPublicZonesForFlow(),
    getPublicShiftBoard({ currentPersonId: person.id, from, to }),
  ]);

  return {
    ok: true as const,
    person,
    zones,
    shifts,
    from,
    to,
    maintenanceModeEnabled: config.maintenanceModeEnabled || hasEventEnded(),
  };
}

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

export async function logoutPublicPersonAction() {
  await clearPublicSession();
  redirectTo("/solicitar?notice=Sesion%20cerrada.");
}

export async function submitShiftRequestsAction(formData: FormData) {
  const currentPerson = await requireSessionPerson();
  const returnTo = String(formData.get("returnTo") ?? "/solicitar");
  const selectedShiftIds = Array.from(
    new Set(
      formData
    .getAll("shiftIds")
    .map((value) => String(value))
        .filter(Boolean),
    ),
  );
  const comments = String(formData.get("comments") ?? "").trim();
  const redirectWithRequestError = (message: string): never =>
    redirectTo(buildRedirect(returnTo, { requestError: message }));

  if (selectedShiftIds.length === 0) {
    redirectWithRequestError("Selecciona al menos un turno.");
  }

  if (hasEventEnded()) {
    redirectWithRequestError("El período de solicitudes para este evento ya finalizó.");
  }

  const shifts = await prisma.shift.findMany({
    where: {
      id: {
        in: selectedShiftIds,
      },
      shiftDate: {
        gte: getEventDateRange().from,
        lte: getEventDateRange().to,
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

  }

  await prisma.$transaction(async (tx) => {
    for (const shift of shifts) {
      const created = await tx.shiftRequest.create({
        data: {
          shiftId: shift.id,
          personId: currentPerson.id,
          suggestedPartnerId: null,
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
            suggestedPartnerId: null,
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
  const returnTo = String(formData.get("returnTo") ?? "/asignaciones");
  const redirectWithRequestError = (message: string): never =>
    redirectTo(buildRedirect(returnTo, { requestError: message }));

  if (!requestId) {
    redirectWithRequestError("No se indico la solicitud a cancelar.");
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

  const requestIdToCancel = request?.id;

  if (!requestIdToCancel) {
    redirectWithRequestError("La solicitud ya no puede cancelarse.");
  }

  const resolvedRequestId = requestIdToCancel!;

  await prisma.$transaction([
    prisma.shiftRequest.update({
      where: { id: resolvedRequestId },
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
        entityId: resolvedRequestId,
        actorPersonId: currentPerson.id,
        action: "PUBLIC_REQUEST_CANCELLED",
      },
    }),
  ]);

  revalidatePath("/solicitar");
  revalidatePath("/asignaciones");
  redirectTo(buildRedirect(returnTo, { notice: "Solicitud cancelada." }));
}
