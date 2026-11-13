import {
  PersonGender,
  PersonStatus,
  RelationshipDirection,
  RelationshipType,
  ZoneStatus,
} from "@prisma/client";
import { z } from "zod";
import { formatChileanMobilePhone } from "@/lib/assignment-notifications";

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

const optionalChileanMobilePhone = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .refine((value) => !value || formatChileanMobilePhone(value) !== null, {
    message: "Ingresa un celular chileno con 9 dígitos, por ejemplo +56 9 1234 5678.",
  })
  .transform((value) => value ? formatChileanMobilePhone(value)! : undefined);

export const createPersonSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  gender: z.nativeEnum(PersonGender),
  status: z.nativeEnum(PersonStatus).default(PersonStatus.ACTIVE),
  phone: optionalChileanMobilePhone,
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

export const updatePersonSchema = createPersonSchema.omit({ status: true }).extend({
  id: z.string().uuid(),
  phone: z.string().trim().max(30).transform((value) => value || null)
    .refine((value) => !value || formatChileanMobilePhone(value) !== null, {
      message: "Ingresa un celular chileno con 9 dígitos, por ejemplo +56 9 1234 5678.",
    })
    .transform((value) => value ? formatChileanMobilePhone(value)! : null),
  email: z.string().trim().max(255).email().or(z.literal(""))
    .transform((value) => value || null),
  notes: z.string().trim().transform((value) => value || null),
});

export const deletePersonSchema = z.object({
  id: z.string().uuid(),
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

const optionalCoordinate = (min: number, max: number) => z.preprocess(
  (value) => value == null || (typeof value === "string" && !value.trim()) ? null : value,
  z.coerce.number().min(min).max(max).nullable(),
);

export const saveZoneSchema = createZoneSchema.extend({
  id: z.string().uuid().or(z.literal("")),
  address: z.string().trim().max(250).transform((value) => value || null),
  latitude: optionalCoordinate(-90, 90),
  longitude: optionalCoordinate(-180, 180),
  mapColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
}).refine((value) => (value.latitude === null) === (value.longitude === null), {
  path: ["latitude"],
  message: "Ingresa latitud y longitud, o deja ambas vacías.",
});

export const updateZoneVisibilitySchema = z.object({
  id: z.string().uuid(),
  publicVisible: z.boolean(),
  status: z.nativeEnum(ZoneStatus),
});

export const deleteZoneSchema = z.object({
  id: z.string().uuid(),
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

export const deleteAvailabilitySchema = z.object({
  id: z.string().uuid(),
});
