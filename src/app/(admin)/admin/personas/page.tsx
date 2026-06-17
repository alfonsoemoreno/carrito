import { createPersonAction, updatePersonStatusAction } from "@/features/admin/master-data/actions";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { EmptyState, FieldGrid, FormCard, SelectField, SubmitButton } from "@/components/admin/master-data-cards";
import { prisma } from "@/lib/prisma";
import { Box, Button, Card, CardContent, Chip, Container, Divider, TextField, Typography } from "@mui/material";

export default async function AdminPeoplePage() {
  await requireCurrentAdminPageAccess();
  const people = await prisma.person.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <AdminPageShell
        eyebrow="Personas"
        title="Gestion de personas"
        description="Alta de personas y cambios de estado para solicitudes y asignaciones."
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
                <TextField name="phone" label="Telefono" />
                <TextField name="email" label="Correo" type="email" />
              </FieldGrid>
              <TextField name="notes" label="Observaciones" multiline minRows={2} />
              <SubmitButton label="Crear persona" />
            </Box>
          </FormCard>
        </form>

        {people.length === 0 ? (
          <EmptyState
            title="Sin personas"
            body="Cuando agregues personas apareceran aqui con acciones de estado."
          />
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
            {people.map((person) => (
              <Card key={person.id} sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
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
                      <form action={updatePersonStatusAction}>
                        <input type="hidden" name="id" value={person.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={person.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
                        />
                        <Button type="submit" variant="outlined">
                          {person.status === "ACTIVE" ? "Desactivar" : "Activar"}
                        </Button>
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
