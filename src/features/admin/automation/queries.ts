import { AssignmentStatus, ShiftRequestStatus, ShiftStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findTemplateHorizonGaps } from "@/features/admin/automation/service";
import { formatDate, formatTime } from "@/features/admin/master-data/utils";

export async function getAutomationDashboardData() {
  const config = await prisma.systemConfig.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      visibleWeeks: true,
      generateFutureWeeks: true,
      maintenanceModeEnabled: true,
      maxRequestsPerWeek: true,
      maxConfirmedPerWeek: true,
      maxConfirmedPerMonth: true,
      allowConsecutiveDays: true,
      allowMultiplePerDay: true,
      allowOverlapping: true,
      allowSameSexPairing: true,
    },
  });

  const horizonGaps = await findTemplateHorizonGaps();
  const horizonGapCount = horizonGaps.reduce((sum, item) => sum + item.missingCount, 0);

  const [
    pendingRequests,
    uncoveredShifts,
    blockedUpcomingShifts,
    staleOpenShifts,
    upcomingFocusShifts,
  ] = await Promise.all([
    prisma.shiftRequest.count({
      where: {
        status: ShiftRequestStatus.PENDING,
      },
    }),
    prisma.shift.count({
      where: {
        status: ShiftStatus.OPEN,
        shiftDate: {
          gte: new Date(),
        },
        assignments: {
          none: {
            status: AssignmentStatus.CONFIRMED,
          },
        },
      },
    }),
    prisma.shift.count({
      where: {
        status: ShiftStatus.BLOCKED,
        shiftDate: {
          gte: new Date(),
        },
      },
    }),
    prisma.shift.count({
      where: {
        status: ShiftStatus.OPEN,
        shiftDate: {
          lt: new Date(),
        },
      },
    }),
    prisma.shift.findMany({
      where: {
        shiftDate: {
          gte: new Date(),
        },
        OR: [
          {
            requests: {
              some: {
                status: ShiftRequestStatus.PENDING,
              },
            },
          },
          {
            status: ShiftStatus.BLOCKED,
          },
          {
            assignments: {
              none: {
                status: AssignmentStatus.CONFIRMED,
              },
            },
          },
        ],
      },
      orderBy: [{ shiftDate: "asc" }, { startTime: "asc" }],
      take: 8,
      include: {
        zone: {
          select: {
            name: true,
          },
        },
        requests: {
          where: {
            status: ShiftRequestStatus.PENDING,
          },
          select: {
            id: true,
          },
        },
        assignments: {
          where: {
            status: AssignmentStatus.CONFIRMED,
          },
          select: {
            id: true,
          },
        },
      },
    }),
  ]);

  return {
    config,
    alerts: {
      pendingRequests,
      uncoveredShifts,
      blockedUpcomingShifts,
      staleOpenShifts,
      horizonGapCount,
    },
    horizonGaps: horizonGaps
      .filter((item) => item.missingCount > 0)
      .sort((a, b) => b.missingCount - a.missingCount),
    upcomingFocusShifts: upcomingFocusShifts.map((shift) => ({
      id: shift.id,
      zoneName: shift.zone.name,
      dateLabel: formatDate(shift.shiftDate),
      timeLabel: `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`,
      status: shift.status,
      pendingCount: shift.requests.length,
      confirmedCount: shift.assignments.length,
    })),
  };
}
