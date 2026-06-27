"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentAdminActor } from "@/features/admin/master-data/auth";
import {
  generateMissingFutureShifts,
  refreshFutureShiftStatuses,
} from "@/features/admin/automation/service";
import { parseDateOnly } from "@/features/admin/master-data/utils";
import { automationDateRangeSchema } from "./validations";

export async function generateMissingFutureShiftsAction(formData: FormData) {
  const admin = await requireCurrentAdminActor();
  const parsed = automationDateRangeSchema.parse({
    from: formData.get("from"),
    to: formData.get("to"),
  });

  const from = parseDateOnly(parsed.from);
  const to = parseDateOnly(parsed.to);

  await generateMissingFutureShifts(admin.id, { from, to });
  await refreshFutureShiftStatuses(admin.id, { from, to });

  revalidatePath("/admin");
  revalidatePath("/admin/automatizacion");
  revalidatePath("/solicitar");
  revalidatePath("/asignaciones");
}

export async function refreshShiftStatusesAction(formData: FormData) {
  const admin = await requireCurrentAdminActor();
  const parsed = automationDateRangeSchema.parse({
    from: formData.get("from"),
    to: formData.get("to"),
  });

  const from = parseDateOnly(parsed.from);
  const to = parseDateOnly(parsed.to);

  await refreshFutureShiftStatuses(admin.id, { from, to });

  revalidatePath("/admin");
  revalidatePath("/admin/automatizacion");
  revalidatePath("/admin/solicitudes");
  revalidatePath("/solicitar");
  revalidatePath("/asignaciones");
}
