import { getCurrentPublicPerson, getPublicShiftBoard } from "@/features/public/queries";
import { toDateOnlyString } from "@/features/public/utils";
import { getEventDateRange } from "@/lib/event";
import { getMapColor } from "@/lib/places-map";

function isAvailableToRequest(shift: { status: string; ownLatestRequest: { status: string } | null }) {
  return shift.status === "OPEN" &&
    shift.ownLatestRequest?.status !== "PENDING" &&
    shift.ownLatestRequest?.status !== "CONFIRMED";
}

export async function getPublicCalendarViewData() {
  const range = getEventDateRange();
  const currentPerson = await getCurrentPublicPerson();
  const shifts = await getPublicShiftBoard({
    currentPersonId: currentPerson?.id,
    from: toDateOnlyString(range.from),
    to: toDateOnlyString(range.to),
  });
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(range.from);
    date.setUTCDate(date.getUTCDate() + index);

    return {
      dateKey: toDateOnlyString(date),
      weekday: new Intl.DateTimeFormat("es-CL", { weekday: "short", timeZone: "UTC" }).format(date).replace(".", ""),
      dayNumber: new Intl.DateTimeFormat("es-CL", { day: "numeric", timeZone: "UTC" }).format(date),
    };
  });
  const calendarShifts = shifts.map((shift) => ({
    id: shift.id,
    dateKey: shift.dateKey,
    zoneId: shift.zoneId,
    zoneName: shift.zoneName,
    zoneColor: getMapColor(shift.zoneColor),
    startLabel: shift.startLabel,
    endLabel: shift.endLabel,
    status: shift.status,
    requestStatus: shift.ownLatestRequest?.status ?? null,
    available: isAvailableToRequest(shift),
  }));

  return { days, shifts: calendarShifts, currentPerson };
}
