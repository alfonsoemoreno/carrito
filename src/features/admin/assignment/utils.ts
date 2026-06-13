import { RelationshipType } from "@prisma/client";
import {
  getWeekKey,
  isConsecutiveUtcDate,
  isSameUtcDate,
  overlapsTimeRange,
  toDateOnlyString,
} from "@/features/public/utils";

type LightweightShift = {
  id: string;
  shiftDate: Date;
  startTime: Date;
  endTime: Date;
};

type AssignmentRuleContext = {
  config: {
    allowSameSexPairing: boolean;
    allowConsecutiveDays: boolean;
    allowMultiplePerDay: boolean;
    allowOverlapping: boolean;
    maxConfirmedPerWeek: number;
    maxConfirmedPerMonth: number;
  };
  pair: {
    person1: {
      id: string;
      label: string;
      gender: string;
      status: string;
    };
    person2: {
      id: string;
      label: string;
      gender: string;
      status: string;
    };
  };
  shift: LightweightShift;
  relationshipTypes: RelationshipType[];
  person1Assignments: LightweightShift[];
  person2Assignments: LightweightShift[];
  person1Availability: Array<{ startDate: Date; endDate: Date }>;
  person2Availability: Array<{ startDate: Date; endDate: Date }>;
  activeAssignmentId?: string | null;
};

function isPairExplicitlyAllowed(relationshipTypes: RelationshipType[]) {
  return relationshipTypes.some((type) =>
    [
      RelationshipType.MARRIAGE,
      RelationshipType.PARENT_CHILD,
      RelationshipType.ADMIN_EXCEPTION,
    ].includes(type),
  );
}

function countMonthlyAssignments(assignments: LightweightShift[], shiftDate: Date) {
  return assignments.filter((assignment) => {
    return (
      assignment.shiftDate.getUTCFullYear() === shiftDate.getUTCFullYear() &&
      assignment.shiftDate.getUTCMonth() === shiftDate.getUTCMonth()
    );
  }).length;
}

function countWeeklyAssignments(assignments: LightweightShift[], shiftDate: Date) {
  const weekKey = getWeekKey(shiftDate);
  return assignments.filter((assignment) => getWeekKey(assignment.shiftDate) === weekKey).length;
}

function hasAvailabilityConflict(
  availability: Array<{ startDate: Date; endDate: Date }>,
  shiftDate: Date,
) {
  const target = toDateOnlyString(shiftDate);

  return availability.some((block) => {
    return target >= toDateOnlyString(block.startDate) && target <= toDateOnlyString(block.endDate);
  });
}

function buildPersonWarnings(
  person: AssignmentRuleContext["pair"]["person1"],
  shift: LightweightShift,
  assignments: LightweightShift[],
  availability: Array<{ startDate: Date; endDate: Date }>,
  config: AssignmentRuleContext["config"],
) {
  const warnings: string[] = [];

  if (person.status !== "ACTIVE") {
    warnings.push(`${person.label} esta inactivo.`);
  }

  if (hasAvailabilityConflict(availability, shift.shiftDate)) {
    warnings.push(`${person.label} tiene indisponibilidad registrada para esa fecha.`);
  }

  const weeklyCount = countWeeklyAssignments(assignments, shift.shiftDate);
  if (weeklyCount >= config.maxConfirmedPerWeek) {
    warnings.push(`${person.label} ya alcanzo el maximo semanal de turnos confirmados.`);
  }

  const monthlyCount = countMonthlyAssignments(assignments, shift.shiftDate);
  if (monthlyCount >= config.maxConfirmedPerMonth) {
    warnings.push(`${person.label} ya alcanzo el maximo mensual de turnos confirmados.`);
  }

  for (const assignment of assignments) {
    if (!config.allowMultiplePerDay && isSameUtcDate(assignment.shiftDate, shift.shiftDate)) {
      warnings.push(`${person.label} ya tiene otro turno confirmado el mismo dia.`);
      break;
    }
  }

  for (const assignment of assignments) {
    if (!config.allowConsecutiveDays && isConsecutiveUtcDate(assignment.shiftDate, shift.shiftDate)) {
      warnings.push(`${person.label} quedaria con dias consecutivos.`);
      break;
    }
  }

  for (const assignment of assignments) {
    if (
      !config.allowOverlapping &&
      isSameUtcDate(assignment.shiftDate, shift.shiftDate) &&
      overlapsTimeRange(
        assignment.startTime,
        assignment.endTime,
        shift.startTime,
        shift.endTime,
      )
    ) {
      warnings.push(`${person.label} tiene superposicion horaria con otro turno confirmado.`);
      break;
    }
  }

  return warnings;
}

export function buildAssignmentWarnings(context: AssignmentRuleContext) {
  const warnings: string[] = [];

  if (context.pair.person1.id === context.pair.person2.id) {
    warnings.push("Debes seleccionar dos personas diferentes.");
  }

  const explicitPairAllowed = isPairExplicitlyAllowed(context.relationshipTypes);
  const sameSexAllowed =
    context.config.allowSameSexPairing &&
    context.pair.person1.gender === context.pair.person2.gender;

  if (!sameSexAllowed && !explicitPairAllowed) {
    warnings.push("La pareja seleccionada no cumple las reglas configuradas.");
  }

  warnings.push(
    ...buildPersonWarnings(
      context.pair.person1,
      context.shift,
      context.person1Assignments,
      context.person1Availability,
      context.config,
    ),
  );
  warnings.push(
    ...buildPersonWarnings(
      context.pair.person2,
      context.shift,
      context.person2Assignments,
      context.person2Availability,
      context.config,
    ),
  );

  return [...new Set(warnings)];
}

export function appendAdminNote(existing: string | null, note: string) {
  if (!existing) {
    return note;
  }

  return `${existing}\n\n[Admin] ${note}`;
}
