"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentAdminActor } from "@/features/admin/master-data/auth";
import {
  generateMissingFutureShifts,
  refreshFutureShiftStatuses,
} from "@/features/admin/automation/service";
import { prisma } from "@/lib/prisma";
import { automationHorizonWeeksSchema } from "./validations";

async function persistAutomationHorizonWeeks(adminId: string, weeks: number) {
  await prisma.systemConfig.upsert({
    where: {
      configKey: "default",
    },
    create: {
      configKey: "default",
      congregationName: "Congregación",
      city: "Ciudad",
      systemName: "Carrito",
      generateFutureWeeks: weeks,
      updatedByAdminId: adminId,
    },
    update: {
      generateFutureWeeks: weeks,
      updatedByAdminId: adminId,
    },
  });
}

export async function generateMissingFutureShiftsAction(formData: FormData) {
  const admin = await requireCurrentAdminActor();
  const parsed = automationHorizonWeeksSchema.parse({
    weeks: formData.get("weeks"),
  });

  await persistAutomationHorizonWeeks(admin.id, parsed.weeks);
  await generateMissingFutureShifts(admin.id, parsed.weeks);
  await refreshFutureShiftStatuses(admin.id, parsed.weeks);

  revalidatePath("/admin");
  revalidatePath("/admin/automatizacion");
  revalidatePath("/solicitar");
  revalidatePath("/asignaciones");
}

export async function refreshShiftStatusesAction(formData: FormData) {
  const admin = await requireCurrentAdminActor();
  const parsed = automationHorizonWeeksSchema.parse({
    weeks: formData.get("weeks"),
  });

  await persistAutomationHorizonWeeks(admin.id, parsed.weeks);
  await refreshFutureShiftStatuses(admin.id, parsed.weeks);

  revalidatePath("/admin");
  revalidatePath("/admin/automatizacion");
  revalidatePath("/admin/solicitudes");
  revalidatePath("/solicitar");
  revalidatePath("/asignaciones");
}
