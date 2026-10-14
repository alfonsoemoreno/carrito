import {
  createPersonAction,
  deletePersonAction,
  updatePersonStatusAction,
} from "@/features/admin/master-data/actions";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { ActionSubmitButton } from "@/components/feedback/action-submit-button";
import { PersonEditor } from "@/components/admin/person-editor";
import { EmptyState, FieldGrid, FormCard, SelectField, SubmitButton } from "@/components/admin/master-data-cards";
import { prisma } from "@/lib/prisma";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Box, Button, Card, CardContent, Chip, Container, Divider, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";

type AdminPeoplePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminPeoplePage({ searchParams }: AdminPeoplePageProps) {
  await requireCurrentAdminPageAccess();
  const params = await searchParams;
  const rawQuery = params.q;
  const query = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery ?? "").trim();
  const searchTerms = query.split(/\s+/).filter(Boolean);
  const where = searchTerms.length
    ? {
        AND: searchTerms.map((term) => ({
          OR: [
            { firstName: { contains: term, mode: "insensitive" as const } },
            { lastName: { contains: term, mode: "insensitive" as const } },
            { email: { contains: term, mode: "insensitive" as const } },
            { phone: { contains: term, mode: "insensitive" as const } },
          ],
        })),
      }
    : undefined;
  const people = await prisma.person.findMany({
    where,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <AdminPageShell
        eyebrow="Personas"
        title="Gestion de personas"
        description="Crea personas, edita sus datos y administra su estado para solicitudes y asignaciones."
      >
        <form action={createPersonAction}>
          <FormCard
            title="Nueva persona"
            description="Crea una persona activa o inactiva con sus datos base."
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FieldGrid>
                <TextField name="firstName" label="Nombre" required />
                <TextField name="lastName" label="Apellido" required />
                <SelectField
                  name="gender"
                  label="Sexo"
                  defaultValue="MALE"
                  options={[
                    { value: "MALE", label: "Masculino" },
                    { value: "FEMALE", label: "Femenino" },
                  ]}
                />
                <SelectField
                  name="status"
                  label="Estado"
                  defaultValue="ACTIVE"
                  options={[
                    { value: "ACTIVE", label: "Activo" },
                    { value: "INACTIVE", label: "Inactivo" },
                  ]}
                />
                <TextField name="phone" label="Teléfono" type="tel"
                  helperText="Celular chileno; se guarda como +56 9 1234 5678." />
                <TextField name="email" label="Correo" type="email" />
              </FieldGrid>
              <TextField name="notes" label="Observaciones" multiline minRows={2} />
              <SubmitButton label="Crear persona" />
            </Box>
          </FormCard>
        </form>

        <Box component="form" action="/admin/personas" method="get" sx={{ mb: 3 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              name="q"
              label="Buscar participantes"
              placeholder="Nombre, apellido, correo o teléfono"
              defaultValue={query}
              fullWidth
            />
            <Button type="submit" variant="contained" startIcon={<SearchRoundedIcon />}>
              Buscar
            </Button>
            {query ? (
              <Link href="/admin/personas">
                <Button variant="outlined">Limpiar</Button>
              </Link>
            ) : null}
          </Stack>
          {query ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {people.length} {people.length === 1 ? "participante encontrado" : "participantes encontrados"}
            </Typography>
          ) : null}
        </Box>

        {people.length === 0 ? (
          <EmptyState
            title={query ? "Sin resultados" : "Sin personas"}
            body={query
              ? "No encontramos participantes que coincidan con la búsqueda. Prueba con otro nombre, correo o teléfono."
              : "Cuando agregues personas apareceran aqui con acciones de estado."}
          />
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
            {people.map((person) => (
              <Card key={person.id} sx={{ borderRadius: 0, border: "1px solid", borderColor: "divider" }}>
                <CardContent>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center" }}>
                      <Box>
                        <Typography variant="h5">
                          {person.firstName} {person.lastName}
                        </Typography>
                        <Typography color="text.secondary">
                          {person.gender === "MALE" ? "Masculino" : "Femenino"}
                        </Typography>
                      </Box>
                      <Chip
                        label={person.status === "ACTIVE" ? "Activo" : "Inactivo"}
                        color={person.status === "ACTIVE" ? "success" : "default"}
                      />
                    </Box>
                    <Divider />
                    <Typography variant="body2" color="text.secondary">
                      {person.email || "Sin correo"} · {person.phone || "Sin telefono"}
                    </Typography>
                    <Typography variant="body2">{person.notes || "Sin observaciones."}</Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                      <PersonEditor person={{ id: person.id, firstName: person.firstName, lastName: person.lastName,
                        gender: person.gender, phone: person.phone, email: person.email, notes: person.notes }} />
                      <Link href={`/admin/personas/${person.id}/turnos`}>
                        <Button variant="outlined">Ver turnos asignados</Button>
                      </Link>
                      <form action={updatePersonStatusAction}>
                        <input type="hidden" name="id" value={person.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={person.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
                        />
                        <ActionSubmitButton
                          variant="outlined"
                          loadingMessage="Estamos actualizando el estado de la persona."
                        >
                          {person.status === "ACTIVE" ? "Desactivar" : "Activar"}
                        </ActionSubmitButton>
                      </form>
                      <form action={deletePersonAction}>
                        <input type="hidden" name="id" value={person.id} />
                        <ActionSubmitButton
                          variant="outlined"
                          color="error"
                          loadingMessage="Estamos eliminando la persona y sus registros asociados."
                        >
                          Eliminar
                        </ActionSubmitButton>
                      </form>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </AdminPageShell>
    </Container>
  );
}
