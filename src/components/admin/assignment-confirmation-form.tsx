"use client";

import { Alert, AlertTitle, Checkbox, FormControlLabel, MenuItem, Stack, TextField } from "@mui/material";
import { useMemo, useState } from "react";
import { ActionSubmitButton } from "@/components/feedback/action-submit-button";
import { confirmShiftAssignmentAction } from "@/features/admin/assignment/actions";

import { RelocationCandidates } from "./relocation-candidates";
import type { RelocationCandidate } from "@/features/admin/assignment/relocation";

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

type SameDayRequest = {
  personId: string;
  shiftId: string;
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
  relocationCandidates: RelocationCandidate[];
  assignments: SameDayAssignment[];
  pendingRequests: SameDayRequest[];
  rules: {
    allowMultiplePerDay: boolean;
    allowOverlapping: boolean;
  };
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
  pendingRequests,
  relocationCandidates,
  rules,
  defaults,
}: Props) {
  const [person1Id, setPerson1Id] = useState(defaults.person1Id);
  const [person2Id, setPerson2Id] = useState(defaults.person2Id);
  const selectedRelocations = relocationCandidates.filter((candidate) => [person1Id, person2Id].includes(candidate.personId));
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
    const requestConflicts: string[] = [];

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

    for (const request of pendingRequests) {
      if (relocationCandidates.some((candidate) => candidate.personId === request.personId) &&
          request.startTime === shift.startTime && request.endTime === shift.endTime && request.zoneName !== shift.zoneName) continue;
      const personLabel = selectedPeople.get(request.personId);
      if (!personLabel) continue;

      const overlapping =
        toMinutes(request.startTime) < targetEnd &&
        toMinutes(request.endTime) > targetStart;

      if (overlapping && !rules.allowOverlapping) {
        requestConflicts.push(
          `${personLabel}: tiene otra solicitud pendiente que se superpone con este turno (${request.startTime}–${request.endTime} en ${request.zoneName}).`,
        );
      } else if (!rules.allowMultiplePerDay) {
        requestConflicts.push(
          `${personLabel}: tiene otra solicitud pendiente el mismo día (${request.startTime}–${request.endTime} en ${request.zoneName}).`,
        );
      }
    }

    return {
      overlaps: [...new Set(overlaps)],
      consecutive: [...new Set(consecutive)],
      requestConflicts: [...new Set(requestConflicts)],
    };
  }, [assignments, pendingRequests, relocationCandidates, people, person1Id, person2Id, rules, shift]);

  return (
    <form action={confirmShiftAssignmentAction}>
      <Stack spacing={2}>
        <RelocationCandidates candidates={relocationCandidates} />
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
              {person.requested ? " · con solicitud" : relocationCandidates.some((candidate) => candidate.personId === person.id) ? " · solicitó en otro lugar" : ""}
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
              {person.requested ? " · con solicitud" : relocationCandidates.some((candidate) => candidate.personId === person.id) ? " · solicitó en otro lugar" : ""}
            </MenuItem>
          ))}
        </TextField>

        {selectedRelocations.map((candidate) => (
          <FormControlLabel
            key={candidate.requestId}
            control={<Checkbox name="relocationConsent" value={candidate.personId} required />}
            label={`${candidate.name} aceptó por WhatsApp cambiar de ${candidate.sourceZone} a ${shift.zoneName}.`}
          />
        ))}

        {scheduleAlerts.overlaps.length > 0 ? (
          <Alert severity="warning">
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

        {scheduleAlerts.requestConflicts.length > 0 ? (
          <Alert severity="warning">
            <AlertTitle>Otra solicitud pendiente</AlertTitle>
            <ul>
              {scheduleAlerts.requestConflicts.map((message) => (
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
