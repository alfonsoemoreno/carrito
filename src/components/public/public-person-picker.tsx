"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Box,
  Alert,
  Button,
  Dialog,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

type PersonOption = { id: string; label: string };
type PublicPersonPickerProps = {
  people: PersonOption[];
  selectedPersonId: string;
  onContinue?: (personId: string) => Promise<void>;
};

function initials(label: string) {
  return label.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("");
}

export function PublicPersonPicker({ people, selectedPersonId, onContinue }: PublicPersonPickerProps) {
  const [personId, setPersonId] = useState(selectedPersonId);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const selectedPerson = people.find((person) => person.id === personId);
  const visiblePeople = useMemo(
    () => people.filter((person) => person.label.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"))),
    [people, query],
  );

  const choosePerson = (id: string) => {
    setPersonId(id);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <form
      action="/public/authenticate"
      method="post"
      data-suppress-global-feedback={onContinue ? "true" : undefined}
      style={{ marginTop: "8px" }}
      onSubmit={async (event) => {
        if (!onContinue) return;
        event.preventDefault();
        if (!personId) return;
        setIsStarting(true);
        setError("");
        try {
          await onContinue(personId);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "No pudimos preparar tu acceso.");
        } finally {
          setIsStarting(false);
        }
      }}
    >
      <Stack spacing={2.5}>
        <Box>
          <Button
            type="button"
            variant="outlined"
            onClick={() => setIsOpen(true)}
            startIcon={<PersonOutlineRoundedIcon />}
            endIcon={selectedPerson ? <CheckRoundedIcon /> : undefined}
            sx={{
              width: "100%",
              minHeight: 64,
              justifyContent: "flex-start",
              px: 2.25,
              borderRadius: 3,
              fontSize: "1rem",
              color: selectedPerson ? "text.primary" : "text.secondary",
              backgroundColor: "background.default",
              "& .MuiButton-endIcon": { ml: "auto", color: "primary.main" },
            }}
          >
            {selectedPerson?.label ?? "Selecciona tu nombre"}
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, px: 0.25 }}>
            Elige tu nombre para consultar tus turnos disponibles.
          </Typography>
        </Box>

        <input type="hidden" name="personId" value={personId} />
        <input type="hidden" name="returnTo" value="/solicitar" />
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={!personId || isStarting}
          sx={{ alignSelf: { xs: "stretch", md: "flex-start" }, minWidth: 190 }}
        >
          {isStarting ? "Preparando…" : "Continuar"}
        </Button>
      </Stack>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              width: "min(100% - 32px, 620px)",
              maxHeight: "min(760px, calc(100dvh - 48px))",
              overflow: "hidden",
              borderRadius: "28px !important",
              boxShadow: "0 24px 72px rgba(31, 31, 31, 0.28) !important",
            },
          },
        }}
      >
        <Box className="person-picker-dialog__header" sx={{ backgroundColor: "background.paper" }}>
          <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
            <Box>
              <Typography variant="overline" color="primary.main">Seleccionar persona</Typography>
              <Typography variant="h4" sx={{ mt: 0.5, fontSize: { xs: "1.55rem", sm: "1.75rem" } }}>¿Quién eres?</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Busca tu nombre para ver tus turnos y solicitudes.
              </Typography>
            </Box>
            <IconButton aria-label="Cerrar selector" onClick={() => setIsOpen(false)} sx={{ flexShrink: 0 }}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </Box>
        <Divider />
        <Box className="person-picker-dialog__body" sx={{ overflow: "hidden", backgroundColor: "background.paper" }}>
          <TextField
            autoFocus
            placeholder="Buscar por nombre o apellido"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>,
              },
            }}
          />
          <Stack spacing={1} sx={{ mt: 3, maxHeight: 350, overflowY: "auto", pr: 0.75 }}>
            {visiblePeople.map((person) => {
              const isSelected = person.id === personId;
              return (
                <Button
                  key={person.id}
                  type="button"
                  onClick={() => choosePerson(person.id)}
                  variant="text"
                  sx={{
                    minHeight: 68,
                    justifyContent: "flex-start",
                    gap: 1.75,
                    px: 1.5,
                    borderRadius: 3.5,
                    color: "text.primary",
                    backgroundColor: isSelected ? "rgba(11, 87, 208, 0.1)" : "transparent",
                    "&:hover": { backgroundColor: isSelected ? "rgba(11, 87, 208, 0.14)" : "var(--app-surface-muted)" },
                  }}
                >
                  <Box sx={{ width: 38, height: 38, display: "grid", placeItems: "center", flexShrink: 0, borderRadius: "50%", backgroundColor: "rgba(11, 87, 208, 0.1)", color: "primary.main", fontSize: "0.82rem", fontWeight: 700 }}>
                    {initials(person.label)}
                  </Box>
                  <Typography sx={{ flex: 1, textAlign: "left", fontWeight: 600 }}>{person.label}</Typography>
                  {isSelected ? <CheckRoundedIcon color="primary" fontSize="small" /> : null}
                </Button>
              );
            })}
            {visiblePeople.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}><Typography color="text.secondary">No encontramos una persona con ese nombre.</Typography></Box>
            ) : null}
          </Stack>
        </Box>
      </Dialog>
    </form>
  );
}
