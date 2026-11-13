"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentAdminActor } from "@/features/admin/master-data/auth";
import { startOfTodayUtc, toDateOnlyString } from "@/features/public/utils";
import { scheduleOperationSchema, type SchedulePlan } from "./planning";
import { loadScheduleSnapshot, persistSchedulePlan, reviewSchedule } from "./service";

export type ScheduleActionState = {
  error?: string; success?: string; token?: string;
  review?: Pick<SchedulePlan, "title" | "existing" | "conflicts" | "dates"> & { created: number; updated: number; schedules: number; suspensions: number; reopened: number };
};

export async function manageScheduleAction(_previous: ScheduleActionState, form: FormData): Promise<ScheduleActionState> {
  const admin = await requireCurrentAdminActor();
  const zone = z.string().uuid().safeParse(form.get("zoneId"));
  if (!zone.success) return { error: "El lugar no es válido." };
  let raw: unknown;
  try { raw = JSON.parse(String(form.get("operation"))); } catch { return { error: "Revisa los datos del formulario." }; }
  const parsed = scheduleOperationSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  const apply = form.get("intent") === "apply";
  try {
    const result = await prisma.$transaction(async (tx) => {
      const snapshot = await loadScheduleSnapshot(tx, zone.data);
      if (!snapshot) return { error: "El lugar ya no existe." };
      const { plan, token } = reviewSchedule(snapshot, parsed.data, toDateOnlyString(startOfTodayUtc()));
      if (apply) {
        if (parsed.data.kind !== "reactivate" && token !== form.get("token")) return { error: "Los turnos cambiaron desde la revisión. Revisa los cambios nuevamente." };
        if (plan.conflicts.length) return { error: plan.conflicts.map((c) => c.message).join(" ") };
        await persistSchedulePlan(tx, snapshot, parsed.data, plan, admin.id);
        return { success: "Cambios aplicados correctamente." };
      }
      return { token, review: { title: plan.title, existing: plan.existing, conflicts: plan.conflicts, dates: plan.dates, created: plan.shiftCreates.length, updated: plan.shiftUpdates.length, schedules: plan.templateCreates.length + plan.templateUpdates.length, suspensions: plan.blockCreates.length, reopened: plan.blockDeletes.length } };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 30000 });
    if (result.success) {
      revalidatePath("/admin", "layout");
      for (const path of ["/solicitar", "/calendario", "/asignaciones", "/asignaciones/calendario", "/mapa"]) revalidatePath(path);
    }
    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) return { error: "Otro cambio afecta estos horarios. Revisa nuevamente antes de guardar." };
    console.error("Failed to manage place schedule", error);
    return { error: "No se pudieron guardar los cambios. Intenta nuevamente." };
  }
}
