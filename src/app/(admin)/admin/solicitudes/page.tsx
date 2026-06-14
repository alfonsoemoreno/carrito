import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { EmptyState, FormCard } from "@/components/admin/master-data-cards";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";
import {
  getAdminAssignmentOverview,
  getAdminRequestsPageState,
} from "@/features/admin/assignment/queries";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminRequestsPage({ searchParams }: Props) {
  await requireCurrentAdminPageAccess();
  const [overview, state] = await Promise.all([
    getAdminAssignmentOverview(),
    getAdminRequestsPageState(searchParams),
  ]);

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <AdminPageShell
          eyebrow="Operación"
          title="Bandeja de solicitudes"
          description="Prioriza turnos con pendientes y entra a la vista centrada en resolver cada asignacion."
        >
          {state.notice ? (
            <Alert severity="success">{state.notice}</Alert>
          ) : null}
          {state.error ? <Alert severity="error">{state.error}</Alert> : null}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2.5,
            }}
          >
            <FormCard
              title="Turnos con pendientes"
              description="Cantidad de turnos que requieren decision administrativa."
            >
              <Typography variant="h3">{overview.pendingShifts}</Typography>
            </FormCard>
            <FormCard
              title="Solicitudes pendientes"
              description="Intenciones todavia no confirmadas ni rechazadas."
            >
              <Typography variant="h3">{overview.pendingRequests}</Typography>
            </FormCard>
            <FormCard
              title="Asignaciones confirmadas"
              description="Turnos ya cubiertos con pareja confirmada."
            >
              <Typography variant="h3">
                {overview.confirmedAssignments}
              </Typography>
            </FormCard>
          </Box>

          <Card
            sx={{
              borderRadius: 5,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent>
              <Stack spacing={2.5}>
                <Typography variant="h5">Filtrar bandeja</Typography>
                <form action="/admin/solicitudes">
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel id="zone-filter-label">Lugar</InputLabel>
                      <Select
                        labelId="zone-filter-label"
                        name="zoneId"
                        defaultValue={state.filters.zoneId}
                        label="Lugar"
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {state.zones.map((zone) => (
                          <MenuItem key={zone.id} value={zone.id}>
                            {zone.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel id="pending-filter-label">Filtro</InputLabel>
                      <Select
                        labelId="pending-filter-label"
                        name="onlyPending"
                        defaultValue={state.filters.onlyPending}
                        label="Filtro"
                      >
                        <MenuItem value="true">
                          Solo turnos con pendientes
                        </MenuItem>
                        <MenuItem value="false">
                          Todos los turnos filtrados
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <Button type="submit" variant="outlined">
                      Aplicar
                    </Button>
                  </Stack>
                </form>
              </Stack>
            </CardContent>
          </Card>

          {state.shifts.length === 0 ? (
            <EmptyState
              title="Sin turnos para revisar"
              body="No hay solicitudes pendientes con los filtros actuales."
            />
          ) : (
            <Stack spacing={2.5}>
              {state.shifts.map((shift) => (
                <Card
                  key={shift.id}
                  sx={{
                    borderRadius: 5,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1.5}
                        sx={{
                          justifyContent: "space-between",
                          alignItems: { xs: "flex-start", md: "center" },
                        }}
                      >
                        <Box>
                          <Typography variant="h5">{shift.zoneName}</Typography>
                          <Typography color="text.secondary">
                            {shift.dateLabel} · {shift.timeLabel}
                          </Typography>
                        </Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ flexWrap: "wrap" }}
                        >
                          <Chip
                            label={`${shift.pendingCount} pendientes`}
                            color="warning"
                          />
                          <Chip
                            label={`${shift.resolvedCount} resueltas`}
                            variant="outlined"
                          />
                          {shift.currentAssignmentLabel ? (
                            <Chip
                              label="Ya asignado"
                              color="success"
                              variant="outlined"
                            />
                          ) : null}
                        </Stack>
                      </Stack>

                      {shift.currentAssignmentLabel ? (
                        <Typography color="text.secondary">
                          Asignacion actual: {shift.currentAssignmentLabel}
                        </Typography>
                      ) : null}

                      {shift.pairHints.length > 0 ? (
                        <Stack spacing={0.5}>
                          {shift.pairHints.map((hint) => (
                            <Typography
                              key={hint.id}
                              variant="body2"
                              color="text.secondary"
                            >
                              {hint.label}
                            </Typography>
                          ))}
                        </Stack>
                      ) : null}

                      <Link href={`/admin/turnos/${shift.id}`}>
                        <Button
                          variant="contained"
                          startIcon={<AssignmentTurnedInRoundedIcon />}
                        >
                          Resolver turno
                        </Button>
                      </Link>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </AdminPageShell>
      </Container>
    </Box>
  );
}
