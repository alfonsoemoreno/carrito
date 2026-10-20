import { formatDate, formatTime } from "@/features/public/utils";
import { buildRelocationWhatsAppLink } from "@/lib/assignment-notifications";

type Slot = {
  id: string;
  zoneId: string;
  shiftDate: Date;
  startTime: Date;
  endTime: Date;
};

export function isSameSlotInOtherZone(target: Slot, source: Slot) {
  return target.zoneId !== source.zoneId &&
    target.shiftDate.getTime() === source.shiftDate.getTime() &&
    target.startTime.getTime() === source.startTime.getTime() &&
    target.endTime.getTime() === source.endTime.getTime();
}

type RelocationRequest = {
  id: string;
  personId: string;
  comments: string | null;
  person: { firstName: string; lastName: string; phone: string | null; notes: string | null };
  shift: Slot & { zone: { name: string } };
};

export function relocationCandidates(
  target: Slot & { zone: { name: string }; requests: { personId: string }[] },
  requests: RelocationRequest[],
) {
  const seen = new Set(target.requests.map((request) => request.personId));
  return requests.filter((request) => {
    if (seen.has(request.personId) || !isSameSlotInOtherZone(target, request.shift)) return false;
    seen.add(request.personId);
    return true;
  }).map((request) => ({
    requestId: request.id,
    personId: request.personId,
    name: `${request.person.firstName} ${request.person.lastName}`,
    sourceZone: request.shift.zone.name,
    comments: request.comments,
    notes: request.person.notes,
    whatsappHref: buildRelocationWhatsAppLink({
      phone: request.person.phone,
      name: request.person.firstName,
      sourceZone: request.shift.zone.name,
      targetZone: target.zone.name,
      date: formatDate(target.shiftDate),
      time: `${formatTime(target.startTime)} - ${formatTime(target.endTime)}`,
    }),
  }));
}

export type RelocationCandidate = ReturnType<typeof relocationCandidates>[number];
