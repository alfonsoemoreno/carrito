export type InboxFocus = "all" | "single" | "alternatives" | "multiple";

type InboxShift = {
  dateKey: string;
  zoneName: string;
  pendingCount: number;
  currentAssignmentLabel: string | null;
  requesters: { name: string }[];
  relocationCandidates: { name: string; sourceZone: string }[];
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
}

export function filterInboxShifts<T extends InboxShift>(shifts: T[], filters: { search: string; day: string; focus: InboxFocus }) {
  const terms = normalize(filters.search).split(/\s+/).filter(Boolean);
  return shifts.filter((shift) => {
    if (filters.day && shift.dateKey !== filters.day) return false;
    if (filters.focus === "single" && (shift.currentAssignmentLabel || shift.pendingCount !== 1)) return false;
    if (filters.focus === "multiple" && (shift.currentAssignmentLabel || shift.pendingCount < 2)) return false;
    if (filters.focus === "alternatives" && shift.relocationCandidates.length === 0) return false;
    const text = normalize([
      shift.zoneName, shift.currentAssignmentLabel ?? "",
      ...shift.requesters.map((person) => person.name),
      ...shift.relocationCandidates.flatMap((person) => [person.name, person.sourceZone]),
    ].join(" "));
    return terms.every((term) => text.includes(term));
  });
}
