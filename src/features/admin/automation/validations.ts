import { z } from "zod";

export const automationDateRangeSchema = z
  .object({
    from: z.string().date(),
    to: z.string().date(),
  })
  .refine((values) => values.from <= values.to, {
    path: ["to"],
    message: "La fecha final no puede ser anterior a la inicial.",
  });
