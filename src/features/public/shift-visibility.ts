import type { Prisma } from "@prisma/client";

const eventClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function getLocalClock(now: Date) {
  const parts = eventClock.formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)!.value;

  // Prisma stores the calendar date and wall-clock time separately, in UTC fields.
  return {
    date: new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00.000Z`),
    time: new Date(`1970-01-01T${part("hour")}:${part("minute")}:${part("second")}.${String(now.getUTCMilliseconds()).padStart(3, "0")}Z`),
  };
}

export function getVisibleShiftWhere(now = new Date()): Prisma.ShiftWhereInput {
  const { date, time } = getLocalClock(now);
  return {
    OR: [
      { shiftDate: { gt: date } },
      { shiftDate: date, endTime: { gt: time } },
    ],
  };
}

export function isShiftVisible(
  shift: { shiftDate: Date; endTime: Date },
  now = new Date(),
) {
  const { date, time } = getLocalClock(now);
  const shiftDate = shift.shiftDate.toISOString().slice(0, 10);
  const today = date.toISOString().slice(0, 10);
  return shiftDate > today ||
    (shiftDate === today && shift.endTime.toISOString().slice(11) > time.toISOString().slice(11));
}
