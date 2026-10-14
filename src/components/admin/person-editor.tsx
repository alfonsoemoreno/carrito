"use client";

import { useActionState, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from "@mui/material";
import { updatePersonAction } from "@/features/admin/master-data/actions";

type PersonDetails = {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

function PersonEditForm({ person, onClose }: { person: PersonDetails; onClose: () => void }) {
  const [state, action, pending] = useActionState(updatePersonAction, { error: "", success: false });
  return (
    <form action={action}>
      <DialogTitle>Editar a {person.firstName} {person.lastName}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {state.error ? <Alert severity="error">{state.error}</Alert> : null}
          {state.success ? <Alert severity="success">Datos guardados correctamente.</Alert> : null}
          <input type="hidden" name="id" value={person.id} />
          <TextField name="firstName" label="Nombre" defaultValue={person.firstName} required fullWidth />
          <TextField name="lastName" label="Apellido" defaultValue={person.lastName} required fullWidth />
          <TextField name="gender" label="Sexo" select defaultValue={person.gender} fullWidth>
            <MenuItem value="MALE">Masculino</MenuItem>
            <MenuItem value="FEMALE">Femenino</MenuItem>
          </TextField>
          <TextField name="phone" label="Teléfono" type="tel" defaultValue={person.phone ?? ""}
            helperText="Celular chileno; se guarda como +56 9 1234 5678." fullWidth />
          <TextField name="email" label="Correo" type="email" defaultValue={person.email ?? ""} fullWidth />
          <TextField name="notes" label="Observaciones" defaultValue={person.notes ?? ""} multiline minRows={2} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>{state.success ? "Cerrar" : "Cancelar"}</Button>
        <Button type="submit" variant="contained" disabled={pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </DialogActions>
    </form>
  );
}

export function PersonEditor({ person }: { person: PersonDetails }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>Editar datos</Button>
      <Dialog open={open} fullWidth maxWidth="sm">
        {open ? <PersonEditForm person={person} onClose={() => setOpen(false)} /> : null}
      </Dialog>
    </>
  );
}
