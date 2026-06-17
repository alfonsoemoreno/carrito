"use server";

import { randomUUID } from "node:crypto";
import { hashPin } from "@/lib/pin";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireCurrentAdminActor } from "./auth";
import {
  createAvailabilitySchema,
  createPersonSchema,
  createRelationshipSchema,
  createShiftBlockSchema,
  createTemplateSchema,
  createZoneSchema,
  deleteAvailabilitySchema,
  deletePersonSchema,
  deleteZoneSchema,
  updatePersonStatusSchema,
  updateZoneVisibilitySchema,
} from "./validations";
import { parseDateOnly, parseTimeOnly } from "./utils";

function booleanFromFormData(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function createPlaceholderPinHash() {
  return hashPin(randomUUID());
}

export async function createPersonAction(formData: FormData) {
  const parsed = createPersonSchema.parse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    gender: formData.get("gender"),
    status: formData.get("status") ?? "ACTIVE",
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });

  await prisma.person.create({
    data: {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      gender: parsed.gender,
      status: parsed.status,
      phone: parsed.phone,
      email: parsed.email,
      notes: parsed.notes,
      pinHash: createPlaceholderPinHash(),
      pinUpdatedAt: new Date(),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/personas");
}

export async function updatePersonStatusAction(formData: FormData) {
  const parsed = updatePersonStatusSchema.parse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  await prisma.person.update({
    where: { id: parsed.id },
    data: { status: parsed.status },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/personas");
}

export async function deletePersonAction(formData: FormData) {
  const parsed = deletePersonSchema.parse({
    id: formData.get("id"),
  });
  await requireCurrentAdminActor();

  await prisma.$transaction(async (tx) => {
    const person = await tx.person.findUnique({
      where: { id: parsed.id },
      select: {
        id: true,
        requests: {
          select: { id: true },
        },
        suggestedInRequests: {
          select: { id: true },
        },
        assignmentSlotsOne: {
          select: { id: true },
        },
        assignmentSlotsTwo: {
          select: { id: true },
        },
        availabilityExceptions: {
          select: { id: true },
        },
        relationshipsAsPersonA: {
          select: { id: true },
        },
        relationshipsAsPersonB: {
          select: { id: true },
        },
      },
    });

    if (!person) {
      return;
    }

    const requestIds = person.requests.map((request) => request.id);
    const suggestedRequestIds = person.suggestedInRequests.map((request) => request.id);
    const assignmentIds = [
      ...person.assignmentSlotsOne.map((assignment) => assignment.id),
      ...person.assignmentSlotsTwo.map((assignment) => assignment.id),
    ];
    const availabilityIds = person.availabilityExceptions.map((record) => record.id);
    const relationshipIds = [
      ...person.relationshipsAsPersonA.map((relationship) => relationship.id),
      ...person.relationshipsAsPersonB.map((relationship) => relationship.id),
    ];

    await tx.auditLog.updateMany({
      where: {
        actorPersonId: person.id,
      },
      data: {
        actorPersonId: null,
      },
    });

    await tx.shiftRequest.updateMany({
      where: {
        suggestedPartnerId: person.id,
      },
      data: {
        suggestedPartnerId: null,
      },
    });

    await tx.auditLog.deleteMany({
      where: {
        entityType: "person",
        entityId: person.id,
      },
    });

    if (requestIds.length > 0) {
      await tx.auditLog.deleteMany({
        where: {
          entityType: "shift_request",
          entityId: { in: requestIds },
        },
      });
    }

    if (assignmentIds.length > 0) {
      await tx.auditLog.deleteMany({
        where: {
          entityType: "assignment",
          entityId: { in: assignmentIds },
        },
      });
    }

    if (availabilityIds.length > 0) {
      await tx.auditLog.deleteMany({
        where: {
          entityType: "availability_exception",
          entityId: { in: availabilityIds },
        },
      });
    }

    if (relationshipIds.length > 0) {
      await tx.auditLog.deleteMany({
        where: {
          entityType: "relationship",
          entityId: { in: relationshipIds },
        },
      });
    }

    if (assignmentIds.length > 0) {
      await tx.assignment.deleteMany({
        where: {
          id: { in: assignmentIds },
        },
      });
    }

    if (requestIds.length > 0) {
      await tx.shiftRequest.deleteMany({
        where: {
          id: { in: requestIds },
        },
      });
    }

    if (availabilityIds.length > 0) {
      await tx.availabilityException.deleteMany({
        where: {
          id: { in: availabilityIds },
        },
      });
    }

    if (relationshipIds.length > 0) {
      await tx.relationship.deleteMany({
        where: {
          id: { in: relationshipIds },
        },
      });
    }

    if (suggestedRequestIds.length > 0) {
      await tx.shiftRequest.updateMany({
        where: {
          id: { in: suggestedRequestIds },
        },
        data: {
          suggestedPartnerId: null,
        },
      });
    }

    await tx.person.delete({
      where: { id: person.id },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/personas");
  revalidatePath("/admin/relaciones");
  revalidatePath("/admin/disponibilidad");
  revalidatePath("/admin/solicitudes");
  revalidatePath("/admin/estadisticas");
  revalidatePath("/solicitar");
}

export async function createRelationshipAction(formData: FormData) {
  const parsed = createRelationshipSchema.parse({
    personAId: formData.get("personAId"),
    personBId: formData.get("personBId"),
    type: formData.get("type"),
    direction: formData.get("direction"),
    notes: formData.get("notes"),
  });

  const admin = await requireCurrentAdminActor();

  await prisma.relationship.create({
    data: {
      personAId: parsed.personAId,
      personBId: parsed.personBId,
      type: parsed.type,
      direction: parsed.direction,
      notes: parsed.notes,
      createdByAdminId: admin.id,
    },
  });

  revalidatePath("/admin/relaciones");
}

export async function createZoneAction(formData: FormData) {
  const parsed = createZoneSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
    status: formData.get("status") ?? "ACTIVE",
    publicVisible: booleanFromFormData(formData.get("publicVisible")),
  });

  await prisma.zone.create({
    data: parsed,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/zonas");
}

export async function updateZoneVisibilityAction(formData: FormData) {
  const parsed = updateZoneVisibilitySchema.parse({
    id: formData.get("id"),
    publicVisible: booleanFromFormData(formData.get("publicVisible")),
    status: formData.get("status"),
  });

  await prisma.zone.update({
    where: { id: parsed.id },
    data: {
      publicVisible: parsed.publicVisible,
      status: parsed.status,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/zonas");
}

export async function deleteZoneAction(formData: FormData) {
  const parsed = deleteZoneSchema.parse({
    id: formData.get("id"),
  });
  await requireCurrentAdminActor();

  await prisma.$transaction(async (tx) => {
    const zone = await tx.zone.findUnique({
      where: { id: parsed.id },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        publicVisible: true,
        shifts: {
          select: {
            id: true,
            requests: {
              select: { id: true },
            },
            assignments: {
              select: { id: true },
            },
          },
        },
        templates: {
          select: { id: true },
        },
        blocks: {
          select: { id: true },
        },
      },
    });

    if (!zone) {
      return;
    }

    const shiftIds = zone.shifts.map((shift) => shift.id);
    const requestIds = zone.shifts.flatMap((shift) =>
      shift.requests.map((request) => request.id),
    );
    const assignmentIds = zone.shifts.flatMap((shift) =>
      shift.assignments.map((assignment) => assignment.id),
    );
    const templateIds = zone.templates.map((template) => template.id);
    const directBlockIds = zone.blocks.map((block) => block.id);
    const shiftBlockIds =
      shiftIds.length > 0
        ? await tx.shiftBlock.findMany({
            where: {
              shiftId: { in: shiftIds },
            },
            select: { id: true },
          })
        : [];
    const allBlockIds = [
      ...directBlockIds,
      ...shiftBlockIds.map((block) => block.id),
    ];

    await tx.auditLog.deleteMany({
      where: {
        entityType: "zone",
        entityId: zone.id,
      },
    });

    if (requestIds.length > 0) {
      await tx.auditLog.deleteMany({
        where: {
          entityType: "shift_request",
          entityId: { in: requestIds },
        },
      });
    }

    if (assignmentIds.length > 0) {
      await tx.auditLog.deleteMany({
        where: {
          entityType: "assignment",
          entityId: { in: assignmentIds },
        },
      });
    }

    if (allBlockIds.length > 0) {
      await tx.shiftBlock.deleteMany({
        where: {
          id: { in: allBlockIds },
        },
      });
    }

    if (shiftIds.length > 0) {
      await tx.shiftBlock.deleteMany({
        where: {
          shiftId: { in: shiftIds },
        },
      });

      await tx.shift.deleteMany({
        where: {
          id: { in: shiftIds },
        },
      });
    }

    if (templateIds.length > 0) {
      await tx.shiftTemplate.deleteMany({
        where: {
          id: { in: templateIds },
        },
      });
    }

    await tx.zone.delete({
      where: { id: zone.id },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/zonas");
  revalidatePath("/admin/plantillas");
  revalidatePath("/admin/bloqueos");
  revalidatePath("/admin/solicitudes");
  revalidatePath("/admin/estadisticas");
  revalidatePath("/admin/exportaciones");
  revalidatePath("/solicitar");
}

export async function createTemplateAction(formData: FormData) {
  const parsed = createTemplateSchema.parse({
    zoneId: formData.get("zoneId"),
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    status: formData.get("status") ?? "ACTIVE",
  });

  await prisma.shiftTemplate.create({
    data: {
      zoneId: parsed.zoneId,
      dayOfWeek: parsed.dayOfWeek,
      startTime: parseTimeOnly(parsed.startTime),
      endTime: parseTimeOnly(parsed.endTime),
      status: parsed.status,
    },
  });

  revalidatePath("/admin/plantillas");
}

export async function createShiftBlockAction(formData: FormData) {
  const parsed = createShiftBlockSchema.parse({
    zoneId: formData.get("zoneId"),
    shiftId: formData.get("shiftId"),
    blockType: formData.get("blockType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    reason: formData.get("reason"),
  });

  const admin = await requireCurrentAdminActor();

  await prisma.shiftBlock.create({
    data: {
      zoneId: parsed.zoneId,
      shiftId: parsed.shiftId,
      blockType: parsed.blockType,
      startDate: parseDateOnly(parsed.startDate),
      endDate: parseDateOnly(parsed.endDate),
      reason: parsed.reason,
      createdByAdminId: admin.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/bloqueos");
}

export async function createAvailabilityAction(formData: FormData) {
  const parsed = createAvailabilitySchema.parse({
    personId: formData.get("personId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    reason: formData.get("reason"),
    notes: formData.get("notes"),
  });

  const admin = await requireCurrentAdminActor();

  await prisma.availabilityException.create({
    data: {
      personId: parsed.personId,
      startDate: parseDateOnly(parsed.startDate),
      endDate: parseDateOnly(parsed.endDate),
      reason: parsed.reason,
      notes: parsed.notes,
      createdByAdminId: admin.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/disponibilidad");
}

export async function deleteAvailabilityAction(formData: FormData) {
  const parsed = deleteAvailabilitySchema.parse({
    id: formData.get("id"),
  });
  await requireCurrentAdminActor();

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany({
      where: {
        entityType: "availability_exception",
        entityId: parsed.id,
      },
    });

    await tx.availabilityException.delete({
      where: { id: parsed.id },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/disponibilidad");
  revalidatePath("/admin/estadisticas");
  revalidatePath("/solicitar");
}
