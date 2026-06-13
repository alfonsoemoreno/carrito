import { ShiftStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addDaysUtc, startOfTodayUtc, toDateOnlyString } from "@/features/public/utils";

function appliesDateBlock(
  shiftDate: Date,
  block: { startDate: Date; endDate: Date },
) {
  const target = toDateOnlyString(shiftDate);
  return target >= toDateOnlyString(block.startDate) && target <= toDateOnlyString(block.endDate);
}

function computeShiftStatus(input: {
  shiftDate: Date;
  confirmedAssignments: number;
  zoneBlocks: Array<{ startDate: Date; endDate: Date }>;
  shiftBlocks: Array<{ startDate: Date; endDate: Date }>;
}) {
  const today = startOfTodayUtc();

  if (toDateOnlyString(input.shiftDate) < toDateOnlyString(today)) {
    return ShiftStatus.CLOSED;
  }

  if (input.confirmedAssignments > 0) {
    return ShiftStatus.FULL;
  }

  const blocked = [...input.zoneBlocks, ...input.shiftBlocks].some((block) =>
    appliesDateBlock(input.shiftDate, block),
  );

  if (blocked) {
    return ShiftStatus.BLOCKED;
  }

  return ShiftStatus.OPEN;
}

function buildExpectedTemplateDates(input: {
  dayOfWeek: number;
  from: Date;
  to: Date;
}) {
  const results: Date[] = [];
  const cursor = new Date(input.from);

  while (cursor <= input.to) {
    if (cursor.getUTCDay() === input.dayOfWeek) {
      results.push(new Date(cursor));
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return results;
}

export async function generateMissingFutureShifts(actorAdminId?: string) {
  const config = await prisma.systemConfig.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      generateFutureWeeks: true,
    },
  });

  const weeks = config?.generateFutureWeeks ?? 8;
  const from = startOfTodayUtc();
  const to = addDaysUtc(from, weeks * 7);

  const [templates, zoneBlocks, existingShifts] = await Promise.all([
    prisma.shiftTemplate.findMany({
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
      },
      orderBy: [{ zoneId: "asc" }, { dayOfWeek: "asc" }],
    }),
    prisma.shiftBlock.findMany({
      where: {
        shiftId: null,
        startDate: {
          lte: to,
        },
        endDate: {
          gte: from,
        },
      },
      select: {
        zoneId: true,
        startDate: true,
        endDate: true,
      },
    }),
    prisma.shift.findMany({
      where: {
        shiftDate: {
          gte: from,
          lte: to,
        },
      },
      select: {
        id: true,
        zoneId: true,
        shiftDate: true,
        startTime: true,
        endTime: true,
      },
    }),
  ]);

  const existingKeys = new Set(
    existingShifts.map((shift) =>
      [
        shift.zoneId,
        toDateOnlyString(shift.shiftDate),
        shift.startTime.toISOString(),
        shift.endTime.toISOString(),
      ].join("|"),
    ),
  );

  const pendingCreates: Array<{
    zoneId: string;
    templateId: string;
    shiftDate: Date;
    startTime: Date;
    endTime: Date;
    status: ShiftStatus;
  }> = [];

  for (const template of templates) {
    const matchingZoneBlocks = zoneBlocks.filter((block) => block.zoneId === template.zoneId);
    const dates = buildExpectedTemplateDates({
      dayOfWeek: template.dayOfWeek,
      from,
      to,
    });

    for (const shiftDate of dates) {
      const key = [
        template.zoneId,
        toDateOnlyString(shiftDate),
        template.startTime.toISOString(),
        template.endTime.toISOString(),
      ].join("|");

      if (existingKeys.has(key)) {
        continue;
      }

      pendingCreates.push({
        zoneId: template.zoneId,
        templateId: template.id,
        shiftDate,
        startTime: template.startTime,
        endTime: template.endTime,
        status: matchingZoneBlocks.some((block) => appliesDateBlock(shiftDate, block))
          ? ShiftStatus.BLOCKED
          : ShiftStatus.OPEN,
      });
      existingKeys.add(key);
    }
  }

  if (pendingCreates.length > 0) {
    await prisma.shift.createMany({
      data: pendingCreates.map((shift) => ({
        zoneId: shift.zoneId,
        templateId: shift.templateId,
        shiftDate: shift.shiftDate,
        startTime: shift.startTime,
        endTime: shift.endTime,
        status: shift.status,
        generated: true,
      })),
      skipDuplicates: true,
    });
  }

  if (actorAdminId) {
    await prisma.auditLog.create({
      data: {
        actorType: "ADMIN",
        entityType: "shift_generation_run",
        entityId: actorAdminId,
        actorAdminId,
        action: "GENERATE_MISSING_FUTURE_SHIFTS",
        afterData: {
          createdCount: pendingCreates.length,
          from: from.toISOString(),
          to: to.toISOString(),
        },
      },
    });
  }

  return {
    createdCount: pendingCreates.length,
    horizonWeeks: weeks,
    from,
    to,
  };
}

export async function refreshFutureShiftStatuses(actorAdminId?: string) {
  const today = startOfTodayUtc();
  const shifts = await prisma.shift.findMany({
    where: {
      shiftDate: {
        gte: addDaysUtc(today, -7),
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
        },
      },
    });
  }

  return {
    updatedCount: updates.length,
  };
}

export async function findTemplateHorizonGaps() {
  const config = await prisma.systemConfig.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      generateFutureWeeks: true,
    },
  });

  const weeks = config?.generateFutureWeeks ?? 8;
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
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      zone: {
        select: {
          name: true,
        },
      },
      shifts: {
        where: {
          shiftDate: {
            gte: from,
            lte: to,
          },
        },
        select: {
          shiftDate: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });

  return templates.map((template) => {
    const expectedDates = buildExpectedTemplateDates({
      dayOfWeek: template.dayOfWeek,
      from,
      to,
    });
    const existingKeys = new Set(
      template.shifts.map((shift) =>
        [
          toDateOnlyString(shift.shiftDate),
          shift.startTime.toISOString(),
          shift.endTime.toISOString(),
        ].join("|"),
      ),
    );

    const missingDates = expectedDates.filter((shiftDate) => {
      const key = [
        toDateOnlyString(shiftDate),
        template.startTime.toISOString(),
        template.endTime.toISOString(),
      ].join("|");

      return !existingKeys.has(key);
    });

    return {
      templateId: template.id,
      zoneName: template.zone.name,
      missingCount: missingDates.length,
      nextMissingDate: missingDates[0] ?? null,
    };
  });
}
