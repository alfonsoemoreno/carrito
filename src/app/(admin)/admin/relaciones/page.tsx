import { createRelationshipAction } from "@/features/admin/master-data/actions";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";
import { getMasterDataPageData } from "@/features/admin/master-data/queries";
import { formatDateTime } from "@/features/admin/master-data/utils";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { EmptyState, FieldGrid, FormCard, SelectField, SubmitButton } from "@/components/admin/master-data-cards";
import { prisma } from "@/lib/prisma";
import { Box, Card, CardContent, Chip, Container, TextField, Typography } from "@mui/material";

export default async function AdminRelationshipsPage() {
  await requireCurrentAdminPageAccess();
  const [{ people }, relationships] = await Promise.all([
    getMasterDataPageData(),
    prisma.relationship.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        personA: true,
        personB: true,
      },
    }),
  ]);

  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <AdminPageShell
        eyebrow="Relaciones"
        title="Relaciones permitidas"
        description="Gestiona matrimonios, padre/madre-hijo/hija y excepciones administrativas."
      >
        <form action={createRelationshipAction}>
          <FormCard
            title="Nueva relacion"
            description="Las excepciones administrativas deben registrar observacion."
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FieldGrid>
                <SelectField
                  name="personAId"
                  label="Persona A"
                  options={people.map((person) => ({
                    value: person.id,
                    label: `${person.lastName}, ${person.firstName}`,
                  }))}
                />
                <SelectField
                  name="personBId"
                  label="Persona B"
                  options={people.map((person) => ({
                    value: person.id,
                    label: `${person.lastName}, ${person.firstName}`,
                  }))}
                />
                <SelectField
                  name="type"
                  label="Tipo"
                  defaultValue="MARRIAGE"
                  options={[
                    { value: "MARRIAGE", label: "Matrimonio" },
                    { value: "PARENT_CHILD", label: "Padre/Madre a Hijo/Hija" },
                    { value: "ADMIN_EXCEPTION", label: "Excepcion administrativa" },
                  ]}
                />
                <SelectField
                  name="direction"
                  label="Direccion"
                  defaultValue="BIDIRECTIONAL"
                  options={[
                    { value: "BIDIRECTIONAL", label: "Bidireccional" },
                    { value: "PARENT_TO_CHILD", label: "Padre/Madre a Hijo/Hija" },
                    { value: "CHILD_TO_PARENT", label: "Hijo/Hija a Padre/Madre" },
                  ]}
                />
              </FieldGrid>
              <TextField name="notes" label="Observacion" multiline minRows={2} />
              <SubmitButton label="Crear relacion" />
            </Box>
          </FormCard>
        </form>

        {relationships.length === 0 ? (
          <EmptyState title="Sin relaciones" body="Todavia no hay relaciones cargadas." />
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
            {relationships.map((relationship) => (
              <Card key={relationship.id} sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
                <CardContent>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                      <Typography variant="h5">
                        {relationship.personA.firstName} {relationship.personA.lastName}
                      </Typography>
                      <Chip label={relationship.type} size="small" />
                    </Box>
                    <Typography color="text.secondary">
                      con {relationship.personB.firstName} {relationship.personB.lastName}
                    </Typography>
                    <Typography variant="body2">Direccion: {relationship.direction}</Typography>
                    <Typography variant="body2">
                      {relationship.notes || "Sin observacion."}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Creada {formatDateTime(relationship.createdAt)}
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
