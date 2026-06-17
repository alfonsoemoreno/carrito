"use server";

import { AssignmentStatus, ShiftRequestStatus, ShiftStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentAdminActor } from "@/features/admin/master-data/auth";
import { appendAdminNote, buildAssignmentWarnings } from "@/features/admin/assignment/utils";
import {
  confirmShiftAssignmentSchema,
  rejectShiftRequestSchema,
} from "@/features/admin/assignment/validations";

function redirectTo(path: string): never {
  redirect(path as never);
}

function buildShiftRedirect(shiftId: string, params: Record<string, string | null | undefined>) {
  const url = new URL(`/admin/turnos/${shiftId}`, "http://localhost");

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

export async function rejectShiftRequestAction(formData: FormData) {
  const parsed = rejectShiftRequestSchema.safeParse({
    requestId: formData.get("requestId"),
    shiftId: formData.get("shiftId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    const shiftId = String(formData.get("shiftId") ?? "");
    const error =
      parsed.error.issues[0]?.message ?? "Debes indicar un motivo valido para rechazar la solicitud.";
    redirectTo(buildShiftRedirect(shiftId, { error }));
  }

  const admin = await requireCurrentAdminActor();

  const request = await prisma.shiftRequest.findFirst({
    where: {
      id: parsed.data.requestId,
      shiftId: parsed.data.shiftId,
      status: ShiftRequestStatus.PENDING,
    },
  });

  if (!request) {
    redirectTo(buildShiftRedirect(parsed.data.shiftId, { error: "La solicitud ya no esta pendiente." }));
  }

  await prisma.$transaction([
    prisma.shiftRequest.update({
      where: { id: parsed.data.requestId },
      data: {
        status: ShiftRequestStatus.REJECTED,
        resolvedAt: new Date(),
        comments: appendAdminNote(request.comments, `Rechazada: ${parsed.data.reason}`),
      },
    }),
    prisma.auditLog.create({
      data: {
        actorType: "ADMIN",
        entityType: "shift_request",
        entityId: parsed.data.requestId,
        actorAdminId: admin.id,
        action: "SHIFT_REQUEST_REJECTED",
        afterData: {
          reason: parsed.data.reason,
        },
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/solicitudes");
  revalidatePath(`/admin/turnos/${parsed.data.shiftId}`);
  redirectTo(buildShiftRedirect(parsed.data.shiftId, { notice: "Solicitud rechazada." }));
}

export async function confirmShiftAssignmentAction(formData: FormData) {
  const parsed = confirmShiftAssignmentSchema.parse({
    shiftId: formData.get("shiftId"),
    person1Id: formData.get("person1Id"),
    person2Id: formData.get("person2Id"),
    exceptionReason: formData.get("exceptionReason"),
  });

  const admin = await requireCurrentAdminActor();

  const [config, shift, person1, person2, relationships, person1Assignments, person2Assignments, person1Availability, person2Availability] =
    await Promise.all([
      prisma.systemConfig.findFirst({
        orderBy: { createdAt: "asc" },
        select: {
          allowSameSexPairing: true,
          allowConsecutiveDays: true,
          allowMultiplePerDay: true,
          allowOverlapping: true,
          maxConfirmedPerWeek: true,
          maxConfirmedPerMonth: true,
        },
      }),
      prisma.shift.findUnique({
        where: { id: parsed.shiftId },
        include: {
          blocks: {
            select: {
              startDate: true,
              endDate: true,
              reason: true,
            },
          },
          zone: {
            select: {
              blocks: {
                select: {
                  startDate: true,
                  endDate: true,
                  reason: true,
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
            },
          },
          requests: {
            where: {
              status: ShiftRequestStatus.PENDING,
            },
            select: {
              id: true,
              personId: true,
            },
          },
        },
      }),
      prisma.person.findUnique({
        where: { id: parsed.person1Id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gender: true,
          status: true,
        },
      }),
      prisma.person.findUnique({
        where: { id: parsed.person2Id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gender: true,
          status: true,
        },
      }),
      prisma.relationship.findMany({
        where: {
          OR: [
            { personAId: parsed.person1Id, personBId: parsed.person2Id },
            { personAId: parsed.person2Id, personBId: parsed.person1Id },
          ],
        },
        select: {
          type: true,
        },
      }),
      prisma.assignment.findMany({
        where: {
          status: AssignmentStatus.CONFIRMED,
          OR: [{ person1Id: parsed.person1Id }, { person2Id: parsed.person1Id }],
          shiftId: {
            not: parsed.shiftId,
          },
        },
        select: {
          id: true,
          shift: {
            select: {
              id: true,
              shiftDate: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      }).then((rows) => rows.map((row) => row.shift)),
      prisma.assignment.findMany({
        where: {
          status: AssignmentStatus.CONFIRMED,
          OR: [{ person1Id: parsed.person2Id }, { person2Id: parsed.person2Id }],
          shiftId: {
            not: parsed.shiftId,
          },
        },
        select: {
          id: true,
          shift: {
            select: {
              id: true,
              shiftDate: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      }).then((rows) => rows.map((row) => row.shift)),
      prisma.availabilityException.findMany({
        where: {
          personId: parsed.person1Id,
        },
        select: {
          startDate: true,
          endDate: true,
        },
      }),
      prisma.availabilityException.findMany({
        where: {
          personId: parsed.person2Id,
        },
        select: {
          startDate: true,
          endDate: true,
        },
      }),
    ]);

  if (!shift || !person1 || !person2) {
    redirectTo(buildShiftRedirect(parsed.shiftId, { error: "No fue posible cargar el turno o las personas seleccionadas." }));
  }

  if (shift.status === ShiftStatus.CLOSED) {
    redirectTo(buildShiftRedirect(parsed.shiftId, { error: "El turno esta cerrado y ya no admite reasignacion." }));
  }

  if (shift.assignments[0] && !parsed.exceptionReason) {
    redirectTo(
      buildShiftRedirect(parsed.shiftId, {
        error: "Debes indicar un motivo para reemplazar una asignacion existente.",
      }),
    );
  }

  const warnings = buildAssignmentWarnings({
    config: {
      allowSameSexPairing: config?.allowSameSexPairing ?? true,
      allowConsecutiveDays: config?.allowConsecutiveDays ?? false,
      allowMultiplePerDay: config?.allowMultiplePerDay ?? false,
      allowOverlapping: config?.allowOverlapping ?? false,
      maxConfirmedPerWeek: config?.maxConfirmedPerWeek ?? 2,
      maxConfirmedPerMonth: config?.maxConfirmedPerMonth ?? 6,
    },
    pair: {
      person1: {
        id: person1.id,
        label: `${person1.firstName} ${person1.lastName}`,
        gender: person1.gender,
        status: person1.status,
      },
      person2: {
        id: person2.id,
        label: `${person2.firstName} ${person2.lastName}`,
        gender: person2.gender,
        status: person2.status,
      },
    },
    shift: {
      id: shift.id,
      shiftDate: shift.shiftDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
    },
    relationshipTypes: relationships.map((relationship) => relationship.type),
    person1Assignments,
    person2Assignments,
    person1Availability,
    person2Availability,
    activeAssignmentId: shift.assignments[0]?.id ?? null,
  });

  if (
    (shift.status === ShiftStatus.BLOCKED || shift.blocks.length > 0 || shift.zone.blocks.length > 0) &&
    !parsed.exceptionReason
  ) {
    redirectTo(
      buildShiftRedirect(parsed.shiftId, {
        error: "El turno tiene bloqueos relacionados. Debes justificar la excepcion administrativa.",
      }),
    );
  }

  if (warnings.length > 0 && !parsed.exceptionReason) {
    redirectTo(
      buildShiftRedirect(parsed.shiftId, {
        error: `Se detectaron advertencias: ${warnings.join(" ")}`,
      }),
    );
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const currentAssignment = shift.assignments[0];

    if (currentAssignment) {
      await tx.assignment.update({
        where: { id: currentAssignment.id },
        data: {
          status: AssignmentStatus.REPLACED,
          cancelledAt: now,
          ruleExceptionUsed: Boolean(parsed.exceptionReason),
          exceptionReason: parsed.exceptionReason || "Reemplazo administrativo.",
          decidedByAdminId: admin.id,
        },
      });
    }

    const assignment = await tx.assignment.create({
      data: {
        shiftId: shift.id,
        person1Id: person1.id,
        person2Id: person2.id,
        status: AssignmentStatus.CONFIRMED,
        ruleExceptionUsed: warnings.length > 0 || Boolean(parsed.exceptionReason),
        exceptionReason: parsed.exceptionReason || null,
        decidedByAdminId: admin.id,
        confirmedAt: now,
      },
    });

    for (const personId of [person1.id, person2.id]) {
      const existingRequest = await tx.shiftRequest.findFirst({
        where: {
          shiftId: shift.id,
          personId,
        },
      });

      if (existingRequest) {
        await tx.shiftRequest.update({
          where: { id: existingRequest.id },
          data: {
            status: ShiftRequestStatus.CONFIRMED,
            resolvedAt: now,
            cancelledAt: null,
          },
        });
      } else {
        await tx.shiftRequest.create({
          data: {
            shiftId: shift.id,
            personId,
            status: ShiftRequestStatus.CONFIRMED,
            resolvedAt: now,
            comments: "[Admin] Confirmado manualmente sin solicitud previa.",
          },
        });
      }
    }

    await tx.shiftRequest.updateMany({
      where: {
        shiftId: shift.id,
        status: ShiftRequestStatus.PENDING,
        personId: {
          notIn: [person1.id, person2.id],
        },
      },
      data: {
        status: ShiftRequestStatus.REJECTED,
        resolvedAt: now,
      },
    });

    await tx.shift.update({
      where: { id: shift.id },
      data: {
        status: ShiftStatus.FULL,
      },
    });

    await tx.auditLog.create({
      data: {
        actorType: "ADMIN",
        entityType: "assignment",
        entityId: assignment.id,
        actorAdminId: admin.id,
        action: currentAssignment ? "SHIFT_ASSIGNMENT_REPLACED" : "SHIFT_ASSIGNMENT_CONFIRMED",
        afterData: {
          shiftId: shift.id,
          person1Id: person1.id,
          person2Id: person2.id,
          warnings,
          exceptionReason: parsed.exceptionReason || null,
        },
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/solicitudes");
  revalidatePath(`/admin/turnos/${parsed.shiftId}`);
  redirectTo(
    buildShiftRedirect(parsed.shiftId, {
      notice:
        shift.assignments[0]
          ? "Asignacion reemplazada y turno actualizado."
          : "Asignacion confirmada correctamente.",
    }),
  );
}
