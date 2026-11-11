import { EVENT } from "@/lib/event";
import { getWeekKey, toDateOnlyString } from "@/features/public/utils";

type AssignedShift = { id: string; shiftDate: Date };
type RuleInput = {
  shift: AssignedShift;
  pair: { person1: { id: string; label: string }; person2: { id: string; label: string } };
  person1Assignments: AssignedShift[];
  person2Assignments: AssignedShift[];
};

export function getRepeatedPairWarning(input: RuleInput) {
  if (input.pair.person1.id === input.pair.person2.id) return null;
  const week = getWeekKey(input.shift.shiftDate);
  const firstIds = new Set(input.person1Assignments.filter((shift) =>
    shift.id !== input.shift.id && getWeekKey(shift.shiftDate) === week,
  ).map((shift) => shift.id));
  const repeated = input.person2Assignments.some((shift) =>
    shift.id !== input.shift.id && firstIds.has(shift.id) && getWeekKey(shift.shiftDate) === week,
  );
  return repeated
    ? `La pareja ${input.pair.person1.label} + ${input.pair.person2.label} ya tiene otro turno confirmado esa semana.`
    : null;
}

export function getEventAssignmentLimitErrors(input: RuleInput, edition: {
  startDate: string; endDate: string; maxAssignmentsPerPerson: number | null;
} = EVENT) {
  const limit = edition.maxAssignmentsPerPerson;
  if (limit === null) return [];
  const targetDate = toDateOnlyString(input.shift.shiftDate);
  if (targetDate < edition.startDate || targetDate > edition.endDate) return [];
  return [
    { person: input.pair.person1, assignments: input.person1Assignments },
    { person: input.pair.person2, assignments: input.person2Assignments },
  ].flatMap(({ person, assignments }) => {
    const confirmedIds = new Set(assignments.filter((shift) => {
      const day = toDateOnlyString(shift.shiftDate);
      return shift.id !== input.shift.id && day >= edition.startDate && day <= edition.endDate;
    }).map((shift) => shift.id));
    return confirmedIds.size >= limit
      ? [`${person.label} ya tiene ${limit} turnos asignados en el evento. No se pueden confirmar más de ${limit} turnos.`]
      : [];
  });
}
