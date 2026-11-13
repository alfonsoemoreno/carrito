import { blockAppliesToShift, type DateBlock } from "@/lib/shift-blocks";
import type { Prisma } from "@prisma/client";
import { formatTime, toDateOnlyString } from "@/features/public/utils";

export type PendingShift = {
  id: string;
  shiftDate: Date;
  startTime: Date;
  endTime: Date;
  blocks: DateBlock[];
  zone: { id: string; name: string; blocks: DateBlock[] };
};

export function pendingShiftsWhere(from: Date, to: Date, zoneId?: string | null): Prisma.ShiftWhereInput {
  return {
    ...(zoneId ? { zoneId } : {}),
    shiftDate: { gte: from, lte: to },
    status: "OPEN",
    zone: { status: "ACTIVE" },
    assignments: { none: { status: "CONFIRMED" } },
  };
}

export function pendingShiftRows(shifts: PendingShift[], now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const time = `${part("hour")}:${part("minute")}`;
  return shifts.filter((shift) => {
    const date = toDateOnlyString(shift.shiftDate);
    if (date < today || (date === today && formatTime(shift.startTime) <= time)) return false;
    return ![...shift.blocks, ...shift.zone.blocks].some((block) =>
      blockAppliesToShift(shift.id, shift.shiftDate, block),
    );
  }).map((shift) => ({
    zoneId: shift.zone.id,
    zoneName: shift.zone.name,
    dateKey: toDateOnlyString(shift.shiftDate),
    dateLabel: new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "2-digit", month: "long", timeZone: "UTC" }).format(shift.shiftDate),
    timeLabel: `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`,
  }));
}

export type PendingShiftsReport = {
  rangeLabel: string;
  scopeLabel: string;
  generatedAtLabel: string;
  rows: ReturnType<typeof pendingShiftRows>;
};
