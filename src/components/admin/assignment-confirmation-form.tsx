"use client";

import { Alert, AlertTitle, MenuItem, Stack, TextField } from "@mui/material";
import { useMemo, useState } from "react";
import { ActionSubmitButton } from "@/components/feedback/action-submit-button";
import { confirmShiftAssignmentAction } from "@/features/admin/assignment/actions";

type PersonOption = {
  id: string;
  label: string;
  requested: boolean;
};

type SameDayAssignment = {
  shiftId: string;
  person1Id: string;
  person2Id: string;
  startTime: string;
  endTime: string;
  zoneName: string;
};

type Props = {
  shift: {
    id: string;
    zoneName: string;
    dateLabel: string;
    startTime: string;
    endTime: string;
  };
  people: PersonOption[];
  assignments: SameDayAssignment[];
  defaults: {
    person1Id: string;
    person2Id: string;
  };
};

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function AssignmentConfirmationForm({
  shift,
  people,
  assignments,
  defaults,
}: Props) {
  const [person1Id, setPerson1Id] = useState(defaults.person1Id);
  const [person2Id, setPerson2Id] = useState(defaults.person2Id);
  const scheduleAlerts = useMemo(() => {
    const selectedPeople = new Map(
      [person1Id, person2Id]
        .filter(Boolean)
        .map((id) => [id, people.find((person) => person.id === id)?.label ?? "La persona seleccionada"]),
    );
    const targetStart = toMinutes(shift.startTime);
    const targetEnd = toMinutes(shift.endTime);
    const overlaps: string[] = [];
    const consecutive: string[] = [];

    for (const assignment of assignments) {
      const assignedPersonIds = new Set([assignment.person1Id, assignment.person2Id]);
      const overlapping =
        toMinutes(assignment.startTime) < targetEnd &&
        toMinutes(assignment.endTime) > targetStart;
      const directlyBefore = toMinutes(assignment.endTime) === targetStart;
      const directlyAfter = toMinutes(assignment.startTime) === targetEnd;

      for (const [personId, personLabel] of selectedPeople) {
        if (!assignedPersonIds.has(personId)) {
          continue;
        }

        const otherShift = `${assignment.startTime}–${assignment.endTime} en ${assignment.zoneName}`;
        const targetShift = `${shift.startTime}–${shift.endTime} en ${shift.zoneName}`;

        if (overlapping) {
          overlaps.push(
            `${personLabel}: el ${shift.dateLabel}, ${otherShift} coincide con el turno seleccionado (${targetShift}).`,
          );
        } else if (directlyBefore || directlyAfter) {
          const orderedShifts = directlyBefore
            ? `${otherShift} y luego ${targetShift}`
            : `${targetShift} y luego ${otherShift}`;
          consecutive.push(`${personLabel}: tendrá turnos seguidos el ${shift.dateLabel}: ${orderedShifts}.`);
        }
      }
    }

    return { overlaps: [...new Set(overlaps)], consecutive: [...new Set(consecutive)] };
  }, [assignments, people, person1Id, person2Id, shift]);

  return (
    <form action={confirmShiftAssignmentAction}>
      <Stack spacing={2}>
        <input type="hidden" name="shiftId" value={shift.id} />
        <TextField
          select
          name="person1Id"
          label="Persona 1"
          value={person1Id}
          onChange={(event) => setPerson1Id(event.target.value)}
          fullWidth
        >
          {people.map((person) => (
            <MenuItem key={person.id} value={person.id}>
              {person.label}
              {person.requested ? " · con solicitud" : ""}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          name="person2Id"
          label="Persona 2"
          value={person2Id}
          onChange={(event) => setPerson2Id(event.target.value)}
          fullWidth
        >
          {people.map((person) => (
            <MenuItem key={person.id} value={person.id}>
              {person.label}
              {person.requested ? " · con solicitud" : ""}
            </MenuItem>
          ))}
        </TextField>

        {scheduleAlerts.overlaps.length > 0 ? (
          <Alert severity="error">
            <AlertTitle>Superposición horaria</AlertTitle>
            <ul>
              {scheduleAlerts.overlaps.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        {scheduleAlerts.consecutive.length > 0 ? (
          <Alert severity="warning">
            <AlertTitle>Turnos seguidos el mismo día</AlertTitle>
            <ul>
              {scheduleAlerts.consecutive.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        <TextField
          name="exceptionReason"
          label="Motivo de excepción o reemplazo"
          placeholder="Obligatorio si se incumple una regla o si decides reemplazar manualmente"
          multiline
          minRows={3}
          fullWidth
        />
        <ActionSubmitButton
          variant="contained"
          loadingMessage="Estamos confirmando la asignación."
        >
          Confirmar pareja para este turno
        </ActionSubmitButton>
      </Stack>
    </form>
  );
}
