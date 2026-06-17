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
