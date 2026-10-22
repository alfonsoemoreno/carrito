import { prisma } from "@/lib/prisma";
import { formatDate } from "@/features/admin/master-data/utils";
import { resolveStatsRange } from "@/features/admin/stats/utils";
import { pendingShiftRows, pendingShiftsWhere } from "./pending-shifts";

export async function getPendingShiftsReportData(input: { from?: string | null; to?: string | null; zoneId?: string | null }) {
  const range = resolveStatsRange(input);
  const now = new Date();
  const zone = input.zoneId ? await prisma.zone.findUnique({ where: { id: input.zoneId }, select: { name: true } }) : null;
  if (input.zoneId && !zone) return null;
  // This export deliberately never queries people, requests, comments or contact details.
  const shifts = await prisma.shift.findMany({
    where: pendingShiftsWhere(range.from, range.to, input.zoneId),
    orderBy: [{ zone: { name: "asc" } }, { shiftDate: "asc" }, { startTime: "asc" }],
    select: {
      id: true, shiftDate: true, startTime: true, endTime: true,
      blocks: { select: { startDate: true, endDate: true } },
      zone: { select: { id: true, name: true, blocks: { where: { shiftId: null }, select: { startDate: true, endDate: true } } } },
    },
  });
  return {
    rangeLabel: `${formatDate(range.from)} al ${formatDate(range.to)}`,
    scopeLabel: zone?.name ?? "Todos los lugares",
    generatedAtLabel: new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" }).format(now),
    rows: pendingShiftRows(shifts, now),
  };
}
