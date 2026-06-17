"use client";

import { useState } from "react";
import {
  Autocomplete,
  Stack,
  TextField,
} from "@mui/material";
import { ActionSubmitButton } from "@/components/feedback/action-submit-button";

type PersonOption = {
  id: string;
  label: string;
};

type PublicPersonPickerProps = {
  people: PersonOption[];
  selectedPersonId: string;
};

export function PublicPersonPicker({
  people,
  selectedPersonId,
}: PublicPersonPickerProps) {
  const initialSelection =
    people.find((person) => person.id === selectedPersonId) ?? null;
  const [selectedPerson, setSelectedPerson] = useState<PersonOption | null>(
    initialSelection,
  );

  return (
    <form action="/public/authenticate" method="post">
      <Stack spacing={2}>
        <Autocomplete
          options={people}
          value={selectedPerson}
          onChange={(_, value) => {
            setSelectedPerson(value);
          }}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          getOptionLabel={(option) => option.label}
          noOptionsText="No hay personas activas disponibles"
          renderInput={(params) => (
            <TextField
              {...params}
              label="Selecciona tu nombre"
              helperText="Puedes escribir nombre o apellido para filtrar rápido."
              fullWidth
            />
          )}
        />
        <input
          type="hidden"
          name="personId"
          value={selectedPerson?.id ?? ""}
        />
        <input type="hidden" name="returnTo" value="/solicitar" />
        <ActionSubmitButton
          variant="contained"
          size="large"
          disabled={!selectedPerson}
          sx={{ alignSelf: { xs: "stretch", md: "flex-start" }, minWidth: 180 }}
          loadingMessage="Estamos preparando tu acceso."
        >
          Continuar
        </ActionSubmitButton>
      </Stack>
    </form>
  );
}
