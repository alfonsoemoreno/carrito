import { createShiftBlockAction } from "@/features/admin/master-data/actions";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";
import { getMasterDataPageData } from "@/features/admin/master-data/queries";
import { formatDate, formatTime } from "@/features/admin/master-data/utils";
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
  Container,
  TextField,
  Typography,
} from "@mui/material";

export default async function AdminBlocksPage() {
  await requireCurrentAdminPageAccess();
  const [{ zones, shifts }, blocks] = await Promise.all([
    getMasterDataPageData(),
    prisma.shiftBlock.findMany({
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      include: {
        zone: true,
        shift: {
          include: {
            zone: true,
          },
        },
      },
    }),
  ]);

  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <AdminPageShell
        eyebrow="Bloqueos"
        title="Bloqueos de turnos y lugares"
        description="Registra bloqueos por turno, fecha, lugar o rango de fechas."
      >
        <form action={createShiftBlockAction}>
          <FormCard
            title="Nuevo bloqueo"
            description="Puedes asociarlo a un lugar o a un turno especifico."
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FieldGrid>
                <SelectField
                  name="zoneId"
                  label="Lugar"
                  options={[
                    { value: "", label: "Sin lugar fijo" },
                    ...zones.map((zone) => ({
                      value: zone.id,
                      label: zone.name,
                    })),
                  ]}
                  defaultValue=""
                />
                <SelectField
                  name="shiftId"
                  label="Turno especifico"
                  options={[
                    { value: "", label: "Sin turno fijo" },
                    ...shifts.map((shift) => ({
                      value: shift.id,
                      label: `${shift.zone.name} · ${formatDate(shift.shiftDate)} · ${formatTime(shift.startTime)}`,
                    })),
                  ]}
                  defaultValue=""
                />
                <SelectField
                  name="blockType"
                  label="Tipo de bloqueo"
                  defaultValue="SPECIFIC_SHIFT"
                  options={[
                    { value: "SPECIFIC_SHIFT", label: "Turno especifico" },
                    { value: "FULL_DATE", label: "Fecha completa" },
                    { value: "ZONE", label: "Lugar" },
                    { value: "DATE_RANGE", label: "Rango de fechas" },
                  ]}
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
              <SubmitButton label="Crear bloqueo" />
            </Box>
          </FormCard>
        </form>

        {blocks.length === 0 ? (
          <EmptyState
            title="Sin bloqueos"
            body="No hay bloqueos registrados."
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
            {blocks.map((block) => (
              <Card
                key={block.id}
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
                    <Typography variant="h5">{block.blockType}</Typography>
                    <Typography color="text.secondary">
                      {block.zone?.name ||
                        block.shift?.zone.name ||
                        "Sin lugar"}{" "}
                      · {formatDate(block.startDate)} a{" "}
                      {formatDate(block.endDate)}
                    </Typography>
                    {block.shift ? (
                      <Typography variant="body2" color="text.secondary">
                        Turno: {formatDate(block.shift.shiftDate)} ·{" "}
                        {formatTime(block.shift.startTime)} -{" "}
                        {formatTime(block.shift.endTime)}
                      </Typography>
                    ) : null}
                    <Typography variant="body2">{block.reason}</Typography>
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
