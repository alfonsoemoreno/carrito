import { prisma } from "@/lib/prisma";
import { dailyShiftsFiltersSchema, dailyShiftRows, type DailyShiftsReport } from "./daily-shifts";

export async function getDailyShiftsReportData(date: string): Promise<DailyShiftsReport> {
  const input = dailyShiftsFiltersSchema.parse({ date });
  const shiftDate = new Date(`${input.date}T00:00:00.000Z`);
  // All places, independent of the general exports page filters. Never fetch requests.
  const shifts = await prisma.shift.findMany({
    where: { shiftDate },
    orderBy: [{ zone: { name: "asc" } }, { startTime: "asc" }, { endTime: "asc" }],
    select: {
      id: true, shiftDate: true, startTime: true, endTime: true, status: true,
      blocks: { select: { startDate: true, endDate: true, excludedShiftIds: true } },
      zone: { select: { id: true, name: true, status: true, blocks: { where: { shiftId: null }, select: { startDate: true, endDate: true, excludedShiftIds: true } } } },
      assignments: {
        where: { status: "CONFIRMED" },
        orderBy: [{ confirmedAt: "desc" }, { id: "asc" }],
        take: 1,
        select: {
          person1: { select: { firstName: true, lastName: true } },
          person2: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });
  return {
    date: input.date,
    dateLabel: new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(shiftDate),
    generatedAtLabel: new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" }).format(new Date()),
    rows: dailyShiftRows(shifts),
  };
}
