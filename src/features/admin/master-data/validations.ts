import {
  PersonGender,
  PersonStatus,
  RelationshipDirection,
  RelationshipType,
  ShiftBlockType,
  TemplateStatus,
  ZoneStatus,
} from "@prisma/client";
import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) {
      return undefined;
    }

    return value;
  });

export const createPersonSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  gender: z.nativeEnum(PersonGender),
  status: z.nativeEnum(PersonStatus).default(PersonStatus.ACTIVE),
  phone: optionalText,
  email: z
    .email()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  notes: optionalText,
});

export const updatePersonStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(PersonStatus),
});

export const createRelationshipSchema = z.object({
  personAId: z.string().uuid(),
  personBId: z.string().uuid(),
  type: z.nativeEnum(RelationshipType),
  direction: z.nativeEnum(RelationshipDirection),
  notes: optionalText,
});

export const createZoneSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: optionalText,
  status: z.nativeEnum(ZoneStatus).default(ZoneStatus.ACTIVE),
  publicVisible: z.boolean().default(true),
});

export const updateZoneVisibilitySchema = z.object({
  id: z.string().uuid(),
  publicVisible: z.boolean(),
  status: z.nativeEnum(ZoneStatus),
});

export const deleteZoneSchema = z.object({
  id: z.string().uuid(),
});

export const createTemplateSchema = z
  .object({
    zoneId: z.string().uuid(),
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    status: z.nativeEnum(TemplateStatus).default(TemplateStatus.ACTIVE),
  })
  .refine((values) => values.startTime < values.endTime, {
    path: ["endTime"],
    message: "La hora de termino debe ser posterior al inicio.",
  });

export const createShiftBlockSchema = z
  .object({
    zoneId: z
      .string()
      .uuid()
      .optional()
      .or(z.literal(""))
      .transform((value) => value || undefined),
    shiftId: z
      .string()
      .uuid()
      .optional()
      .or(z.literal(""))
      .transform((value) => value || undefined),
    blockType: z.nativeEnum(ShiftBlockType),
    startDate: z.string().date(),
    endDate: z.string().date(),
    reason: z.string().trim().min(4).max(300),
  })
  .refine((values) => values.zoneId || values.shiftId, {
    path: ["zoneId"],
    message: "Debes seleccionar un lugar o un turno especifico.",
  });

export const createAvailabilitySchema = z
  .object({
    personId: z.string().uuid(),
    startDate: z.string().date(),
    endDate: z.string().date(),
    reason: z.string().trim().min(4).max(120),
    notes: optionalText,
  })
  .refine((values) => values.startDate <= values.endDate, {
    path: ["endDate"],
    message: "La fecha final no puede ser anterior a la inicial.",
  });
