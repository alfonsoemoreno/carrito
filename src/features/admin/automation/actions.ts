"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentAdminActor } from "@/features/admin/master-data/auth";
import {
  refreshFutureShiftStatuses,
} from "@/features/admin/automation/service";
import { parseDateOnly } from "@/features/admin/master-data/utils";
import { automationDateRangeSchema } from "./validations";

export async function refreshShiftStatusesAction(formData: FormData) {
  const admin = await requireCurrentAdminActor();
  const parsed = automationDateRangeSchema.parse({
    from: formData.get("from"),
    to: formData.get("to"),
  });

  const from = parseDateOnly(parsed.from);
  const to = parseDateOnly(parsed.to);

  await refreshFutureShiftStatuses(admin.id, { from, to });

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/automatizacion");
  revalidatePath("/admin/solicitudes");
  revalidatePath("/solicitar");
  revalidatePath("/asignaciones");
  revalidatePath("/calendario");
  revalidatePath("/asignaciones/calendario");
}
