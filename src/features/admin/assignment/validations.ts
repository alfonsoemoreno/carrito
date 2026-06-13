import { z } from "zod";

export const rejectShiftRequestSchema = z.object({
  requestId: z.uuid(),
  shiftId: z.uuid(),
  reason: z.string().trim().min(3, "Debes indicar un motivo breve.").max(300),
});

export const confirmShiftAssignmentSchema = z.object({
  shiftId: z.uuid(),
  person1Id: z.uuid(),
  person2Id: z.uuid(),
  exceptionReason: z.string().trim().max(300).optional().or(z.literal("")),
});
