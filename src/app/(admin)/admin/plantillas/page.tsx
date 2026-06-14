import { createTemplateAction } from "@/features/admin/master-data/actions";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";
import { getMasterDataPageData } from "@/features/admin/master-data/queries";
import { formatTime } from "@/features/admin/master-data/utils";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import {
  EmptyState,
  FieldGrid,
  FormCard,
  SelectField,
  SubmitButton,
} from "@/components/admin/master-data-cards";
import { prisma } from "@/lib/prisma";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Typography,
} from "@mui/material";

const dayOptions = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sabado" },
];

const dayNames = new Map(
  dayOptions.map((option) => [option.value, option.label]),
);

export default async function AdminTemplatesPage() {
  await requireCurrentAdminPageAccess();
  const [{ zones }, templates] = await Promise.all([
    getMasterDataPageData(),
    prisma.shiftTemplate.findMany({
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      include: {
        zone: true,
        _count: {
          select: { shifts: true },
        },
      },
    }),
  ]);

  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <AdminPageShell
        eyebrow="Plantillas"
        title="Plantillas recurrentes"
        description="Definen los futuros turnos generables por lugar, dia y horario."
      >
        <form action={createTemplateAction}>
          <FormCard
            title="Nueva plantilla"
            description="Los cambios aqui impactaran futuras generaciones de turnos."
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FieldGrid>
                <SelectField
                  name="zoneId"
                  label="Lugar"
                  options={zones.map((zone) => ({
                    value: zone.id,
                    label: zone.name,
                  }))}
                />
                <SelectField
                  name="dayOfWeek"
                  label="Dia de la semana"
                  defaultValue={6}
                  options={dayOptions}
                />
                <Box>
                  <Typography variant="body2" sx={{ mb: 0.75 }}>
                    Hora inicio
                  </Typography>
                  <input
                    name="startTime"
                    type="time"
                    required
                    style={{
                      width: "100%",
                      minHeight: 56,
                      borderRadius: 18,
                      border: "1px solid rgba(29, 36, 32, 0.12)",
                      padding: "0 14px",
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ mb: 0.75 }}>
                    Hora termino
                  </Typography>
                  <input
                    name="endTime"
                    type="time"
                    required
                    style={{
                      width: "100%",
                      minHeight: 56,
                      borderRadius: 18,
                      border: "1px solid rgba(29, 36, 32, 0.12)",
                      padding: "0 14px",
                    }}
                  />
                </Box>
              </FieldGrid>
              <SelectField
                name="status"
                label="Estado"
                defaultValue="ACTIVE"
                options={[
                  { value: "ACTIVE", label: "Activa" },
                  { value: "INACTIVE", label: "Inactiva" },
                ]}
              />
              <SubmitButton label="Crear plantilla" />
            </Box>
          </FormCard>
        </form>

        {templates.length === 0 ? (
          <EmptyState
            title="Sin plantillas"
            body="Crea una plantilla para comenzar a proyectar turnos."
          />
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "repeat(2, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {templates.map((template) => (
              <Card
                key={template.id}
                sx={{
                  borderRadius: 5,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <CardContent>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Typography variant="h5">{template.zone.name}</Typography>
                      <Chip
                        label={
                          template.status === "ACTIVE" ? "Activa" : "Inactiva"
                        }
                        color={
                          template.status === "ACTIVE" ? "success" : "default"
                        }
                      />
                    </Box>
                    <Typography color="text.secondary">
                      {dayNames.get(template.dayOfWeek)} ·{" "}
                      {formatTime(template.startTime)} -{" "}
                      {formatTime(template.endTime)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {template._count.shifts} turnos asociados
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
