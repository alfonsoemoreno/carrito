import { createAvailabilityAction } from "@/features/admin/master-data/actions";
import { getMasterDataPageData } from "@/features/admin/master-data/queries";
import { formatDate } from "@/features/admin/master-data/utils";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { EmptyState, FieldGrid, FormCard, SelectField, SubmitButton } from "@/components/admin/master-data-cards";
import { prisma } from "@/lib/prisma";
import { Box, Card, CardContent, Container, TextField, Typography } from "@mui/material";

export default async function AdminAvailabilityPage() {
  const [{ people }, records] = await Promise.all([
    getMasterDataPageData(),
    prisma.availabilityException.findMany({
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      include: {
        person: true,
      },
    }),
  ]);

  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <AdminPageShell
        eyebrow="Disponibilidad"
        title="Indisponibilidad personal"
        description="Registra vacaciones, viajes, licencias y otras ausencias temporales."
      >
        <form action={createAvailabilityAction}>
          <FormCard title="Nueva indisponibilidad" description="Esta informacion sera considerada en asignaciones y sugerencias futuras.">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FieldGrid>
                <SelectField
                  name="personId"
                  label="Persona"
                  options={people.map((person) => ({
                    value: person.id,
                    label: `${person.lastName}, ${person.firstName}`,
                  }))}
                />
                <TextField name="reason" label="Motivo" required />
                <TextField
                  name="startDate"
                  label="Fecha inicio"
                  type="date"
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  name="endDate"
                  label="Fecha termino"
                  type="date"
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </FieldGrid>
              <TextField name="notes" label="Observaciones" multiline minRows={2} />
              <SubmitButton label="Registrar indisponibilidad" />
            </Box>
          </FormCard>
        </form>

        {records.length === 0 ? (
          <EmptyState title="Sin registros" body="No hay indisponibilidades registradas." />
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
            {records.map((record) => (
              <Card key={record.id} sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
                <CardContent>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Typography variant="h5">
                      {record.person.firstName} {record.person.lastName}
                    </Typography>
                    <Typography color="text.secondary">
                      {formatDate(record.startDate)} a {formatDate(record.endDate)}
                    </Typography>
                    <Typography variant="body2">{record.reason}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {record.notes || "Sin observaciones."}
                    </Typography>
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
