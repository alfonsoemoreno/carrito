"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentAdminActor } from "@/features/admin/master-data/auth";
import {
  generateMissingFutureShifts,
  refreshFutureShiftStatuses,
} from "@/features/admin/automation/service";

export async function generateMissingFutureShiftsAction() {
  const admin = await requireCurrentAdminActor();
  await generateMissingFutureShifts(admin.id);
  await refreshFutureShiftStatuses(admin.id);

  revalidatePath("/admin");
  revalidatePath("/admin/automatizacion");
  revalidatePath("/solicitar");
  revalidatePath("/asignaciones");
}

export async function refreshShiftStatusesAction() {
  const admin = await requireCurrentAdminActor();
  await refreshFutureShiftStatuses(admin.id);

  revalidatePath("/admin");
  revalidatePath("/admin/automatizacion");
  revalidatePath("/admin/solicitudes");
  revalidatePath("/solicitar");
  revalidatePath("/asignaciones");
}
