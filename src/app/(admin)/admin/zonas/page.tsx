import { createZoneAction, updateZoneVisibilityAction } from "@/features/admin/master-data/actions";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { EmptyState, FieldGrid, FormCard, SelectField, SubmitButton, SwitchField } from "@/components/admin/master-data-cards";
import { prisma } from "@/lib/prisma";
import { Box, Button, Card, CardContent, Chip, Container, TextField, Typography } from "@mui/material";

export default async function AdminZonesPage() {
  const zones = await prisma.zone.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          templates: true,
          shifts: true,
          blocks: true,
        },
      },
    },
  });

  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <AdminPageShell
        eyebrow="Zonas"
        title="Gestion de zonas"
        description="Define las zonas geograficas principales y su visibilidad publica."
      >
        <form action={createZoneAction}>
          <FormCard title="Nueva zona" description="Las zonas son la entidad operativa principal del sistema.">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FieldGrid>
                <TextField name="name" label="Nombre" required />
                <SelectField
                  name="status"
                  label="Estado"
                  defaultValue="ACTIVE"
                  options={[
                    { value: "ACTIVE", label: "Activa" },
                    { value: "INACTIVE", label: "Inactiva" },
                  ]}
                />
              </FieldGrid>
              <TextField name="description" label="Descripcion" multiline minRows={2} />
              <SwitchField name="publicVisible" label="Visible publicamente" defaultChecked />
              <SubmitButton label="Crear zona" />
            </Box>
          </FormCard>
        </form>

        {zones.length === 0 ? (
          <EmptyState title="Sin zonas" body="Crea la primera zona para poder asociar plantillas y turnos." />
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
            {zones.map((zone) => (
              <Card key={zone.id} sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
                <CardContent>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                      <Box>
                        <Typography variant="h5">{zone.name}</Typography>
                        <Typography color="text.secondary">{zone.description || "Sin descripcion."}</Typography>
                      </Box>
                      <Chip label={zone.status === "ACTIVE" ? "Activa" : "Inactiva"} color={zone.status === "ACTIVE" ? "success" : "default"} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {zone.publicVisible ? "Visible" : "Oculta"} · {zone._count.templates} plantillas · {zone._count.shifts} turnos · {zone._count.blocks} bloqueos
                    </Typography>
                    <form action={updateZoneVisibilityAction}>
                      <input type="hidden" name="id" value={zone.id} />
                      <input type="hidden" name="status" value={zone.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"} />
                      <input type="hidden" name="publicVisible" value={zone.publicVisible ? "false" : "true"} />
                      <Button type="submit" variant="outlined">
                        {zone.status === "ACTIVE" ? "Desactivar" : "Activar"} y {zone.publicVisible ? "ocultar" : "mostrar"}
                      </Button>
                    </form>
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
