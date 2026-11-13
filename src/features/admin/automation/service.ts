import { Prisma, ShiftStatus } from "@prisma/client";
import { blockAppliesToShift, type DateBlock } from "@/lib/shift-blocks";
import { prisma } from "@/lib/prisma";
import { loadScheduleSnapshot, persistSchedulePlan } from "@/features/admin/scheduling/service";
import { planSchedule, templateDates } from "@/features/admin/scheduling/planning";
import { addDaysUtc, startOfTodayUtc, toDateOnlyString } from "@/features/public/utils";

type AutomationDateRangeInput = {
  from?: Date;
  to?: Date;
  weeksOverride?: number;
};

function computeShiftStatus(input: {
  shiftId: string;
  shiftDate: Date;
  confirmedAssignments: number;
  zoneBlocks: DateBlock[];
  shiftBlocks: DateBlock[];
}) {
  const today = startOfTodayUtc();

  if (toDateOnlyString(input.shiftDate) < toDateOnlyString(today)) {
    return ShiftStatus.CLOSED;
  }

  if (input.confirmedAssignments > 0) {
    return ShiftStatus.FULL;
  }

  const blocked = [...input.zoneBlocks, ...input.shiftBlocks].some((block) =>
    blockAppliesToShift(input.shiftId, input.shiftDate, block),
  );

  if (blocked) {
    return ShiftStatus.BLOCKED;
  }

  return ShiftStatus.OPEN;
}

async function resolveGenerationWeeks(weeksOverride?: number) {
  if (typeof weeksOverride === "number") {
    return weeksOverride;
  }

  const config = await prisma.systemConfig.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      generateFutureWeeks: true,
    },
  });

  return config?.generateFutureWeeks ?? 8;
}

async function resolveAutomationDateRange(input: AutomationDateRangeInput = {}) {
  if (input.from && input.to) {
    return {
      from: input.from,
      to: input.to,
      horizonWeeks: null,
    };
  }

  const weeks = await resolveGenerationWeeks(input.weeksOverride);
  const from = startOfTodayUtc();
  const to = addDaysUtc(from, weeks * 7);

  return {
    from,
    to,
    horizonWeeks: weeks,
  };
}

export async function generateMissingFutureShifts(
  actorAdminId?: string,
  rangeInput: AutomationDateRangeInput = {},
) {
  const {
    from,
    to,
    horizonWeeks,
  } = await resolveAutomationDateRange(rangeInput);

  const today = toDateOnlyString(startOfTodayUtc());
  const operation = { kind: "generate" as const, from: toDateOnlyString(from), to: toDateOnlyString(to) };
  const createdCount = await prisma.$transaction(async (tx) => {
    const zones = await tx.zone.findMany({ where: { status: "ACTIVE" }, select: { id: true }, orderBy: { id: "asc" } });
    let count = 0;
    for (const zone of zones) {
      const snapshot = await loadScheduleSnapshot(tx, zone.id);
      if (!snapshot) continue;
      const plan = planSchedule(snapshot, operation, today);
      if (plan.conflicts.length) throw new Error(plan.conflicts.map((c) => c.message).join(" "));
      await persistSchedulePlan(tx, snapshot, operation, plan, actorAdminId);
      count += plan.shiftCreates.length;
    }
    return count;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
  return { createdCount, horizonWeeks, from, to };
}

export async function refreshFutureShiftStatuses(
  actorAdminId?: string,
  rangeInput: AutomationDateRangeInput = {},
) {
  const {
    from,
    to,
    horizonWeeks,
  } = await resolveAutomationDateRange(rangeInput);
  const shifts = await prisma.shift.findMany({
    where: {
      shiftDate: {
        gte: from,
        lte: to,
      },
    },
    include: {
      assignments: {
        where: {
          status: "CONFIRMED",
        },
        select: {
          id: true,
        },
      },
      blocks: {
        select: {
          startDate: true,
          endDate: true,
          excludedShiftIds: true,
        },
      },
      zone: {
        select: {
          blocks: {
            where: {
              shiftId: null,
            },
            select: {
              startDate: true,
              endDate: true,
              excludedShiftIds: true,
            },
          },
        },
      },
    },
  });

  const updates = shifts
    .map((shift) => ({
      id: shift.id,
      nextStatus: computeShiftStatus({
        shiftId: shift.id,
        shiftDate: shift.shiftDate,
        confirmedAssignments: shift.assignments.length,
        zoneBlocks: shift.zone.blocks,
        shiftBlocks: shift.blocks,
      }),
      currentStatus: shift.status,
    }))
    .filter((item) => item.currentStatus !== item.nextStatus);

  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map((item) =>
        prisma.shift.update({
          where: { id: item.id },
          data: {
            status: item.nextStatus,
          },
        }),
      ),
    );
  }

  if (actorAdminId) {
    await prisma.auditLog.create({
      data: {
        actorType: "ADMIN",
        entityType: "shift_generation_run",
        entityId: actorAdminId,
        actorAdminId,
        action: "REFRESH_SHIFT_OPERATIONAL_STATUSES",
        afterData: {
          updatedCount: updates.length,
          from: from.toISOString(),
          to: to.toISOString(),
          horizonWeeks,
        },
      },
    });
  }

  return {
    updatedCount: updates.length,
    horizonWeeks,
    from,
    to,
  };
}

export async function findTemplateHorizonGaps(weeksOverride?: number) {
  const weeks = await resolveGenerationWeeks(weeksOverride);
  const from = startOfTodayUtc();
  const to = addDaysUtc(from, weeks * 7);

  const templates = await prisma.shiftTemplate.findMany({
    where: {
      status: "ACTIVE",
      zone: {
        status: "ACTIVE",
      },
    },
    select: {
      id: true,
      zoneId: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      validFrom: true,
      validTo: true,
      zone: {
        select: {
          name: true,
        },
      },
    },
  });

  const existing = await prisma.shift.findMany({
    where: { shiftDate: { gte: from, lte: to } },
    select: { zoneId: true, templateId: true, shiftDate: true, startTime: true, endTime: true },
  });

  return templates.map((template) => {
    const expectedDates = templateDates({
      id: template.id, dayOfWeek: template.dayOfWeek, status: "ACTIVE",
      startTime: "00:00", endTime: "23:59", validFrom: toDateOnlyString(template.validFrom),
      validTo: template.validTo ? toDateOnlyString(template.validTo) : null,
    }, toDateOnlyString(from), toDateOnlyString(to));
    const existingDates = new Set(existing.filter((s) => s.zoneId === template.zoneId && (s.templateId === template.id || s.startTime.getTime() === template.startTime.getTime() && s.endTime.getTime() === template.endTime.getTime())).map((s) => toDateOnlyString(s.shiftDate)));
    const missingDates = expectedDates.filter((date) => !existingDates.has(date)).map((date) => new Date(`${date}T00:00:00Z`));

    return {
      templateId: template.id,
      zoneName: template.zone.name,
      missingCount: missingDates.length,
      nextMissingDate: missingDates[0] ?? null,
    };
  });
}
