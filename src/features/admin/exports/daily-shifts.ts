import { z } from "zod";
import { blockAppliesToShift, type DateBlock } from "@/lib/shift-blocks";
import { formatTime } from "@/features/public/utils";

export const dailyShiftsFiltersSchema = z.object({ date: z.iso.date() });

export type DailyShift = {
  id: string;
  shiftDate: Date;
  startTime: Date;
  endTime: Date;
  status: string;
  blocks: DateBlock[];
  zone: { id: string; name: string; status: string; blocks: DateBlock[] };
  assignments: {
    person1: { firstName: string; lastName: string };
    person2: { firstName: string; lastName: string };
  }[];
};

export function dailyShiftRows(shifts: DailyShift[]) {
  return shifts.map((shift) => {
    const confirmed = shift.assignments[0];
    const blocked = shift.status === "BLOCKED" || shift.status === "CLOSED" || shift.zone.status !== "ACTIVE" ||
      [...shift.blocks, ...shift.zone.blocks].some((block) => blockAppliesToShift(shift.id, shift.shiftDate, block));
    const status = confirmed ? "Completo" : blocked ? "No disponible" : "Por completar";
    // Only names belonging to a confirmed assignment may enter this report.
    return {
      zoneId: shift.zone.id,
      zoneName: shift.zone.name,
      timeLabel: `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`,
      status,
      participants: confirmed ? [confirmed.person1, confirmed.person2].map((person) => `${person.firstName} ${person.lastName}`) : [],
    };
  });
}

export type DailyShiftsReport = {
  date: string;
  dateLabel: string;
  generatedAtLabel: string;
  rows: ReturnType<typeof dailyShiftRows>;
};
