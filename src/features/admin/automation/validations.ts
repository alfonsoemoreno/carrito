import { z } from "zod";

export const automationHorizonWeeksSchema = z.object({
  weeks: z.coerce.number().int().min(1).max(24),
});
