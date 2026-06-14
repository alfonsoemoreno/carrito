"use client";

import { useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type PersonOption = {
  id: string;
  label: string;
  locked: boolean;
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
    <form action="/solicitar">
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
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;

            return (
              <Box key={key} component="li" {...optionProps}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography>{option.label}</Typography>
                  {option.locked ? (
                    <Chip size="small" color="warning" label="PIN bloqueado" />
                  ) : null}
                </Stack>
              </Box>
            );
          }}
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
          name="selectedPersonId"
          value={selectedPerson?.id ?? ""}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={!selectedPerson}
          sx={{ alignSelf: { xs: "stretch", md: "flex-start" }, minWidth: 180 }}
        >
          Continuar con PIN
        </Button>
      </Stack>
    </form>
  );
}
