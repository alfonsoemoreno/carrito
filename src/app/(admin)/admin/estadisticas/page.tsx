import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { EmptyState, FormCard } from "@/components/admin/master-data-cards";
import { getAdminStatsPageState } from "@/features/admin/stats/queries";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminStatsPage({ searchParams }: Props) {
  const state = await getAdminStatsPageState(searchParams);

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <AdminPageShell
          eyebrow="Fase 8"
          title="Estadisticas"
          description="KPIs y reportes operativos sobre turnos, solicitudes y cobertura por rango."
        >
          <Card sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <form action="/admin/estadisticas">
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel id="stats-zone-label">Zona</InputLabel>
                    <Select labelId="stats-zone-label" name="zoneId" defaultValue={state.filters.zoneId} label="Zona">
                      <MenuItem value="">Todas</MenuItem>
                      {state.zones.map((zone) => (
                        <MenuItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <input type="date" name="from" defaultValue={state.filters.from} />
                  <input type="date" name="to" defaultValue={state.filters.to} />
                  <Button type="submit" variant="outlined">
                    Aplicar
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
              gap: 2.5,
            }}
          >
            <AdminStatCard icon={<BarChartRoundedIcon />} label="Turnos totales" value={state.kpis.totalShifts} helper={`Abiertos ${state.kpis.openShifts} · Bloqueados ${state.kpis.blockedShifts} · Completos ${state.kpis.fullShifts}`} />
            <AdminStatCard icon={<QueryStatsRoundedIcon />} label="Cobertura" value={`${state.kpis.coverageRate}%`} helper={`Asignaciones confirmadas ${state.kpis.confirmedAssignments} · Reemplazos ${state.kpis.replacedAssignments}`} />
            <AdminStatCard icon={<QueryStatsRoundedIcon />} label="Solicitudes" value={state.kpis.pendingRequests} helper={`Confirmadas ${state.kpis.confirmedRequests} · Rechazadas ${state.kpis.rejectedRequests} · Canceladas ${state.kpis.cancelledRequests}`} />
            <AdminStatCard icon={<BarChartRoundedIcon />} label="Rango analizado" value={`${state.filters.from} a ${state.filters.to}`} helper="KPIs calculados sobre turnos y movimientos dentro del rango seleccionado." />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
              gap: 2.5,
            }}
          >
            <FormCard title="Top participantes" description="Personas con mas participaciones confirmadas dentro del rango.">
              {state.topPeople.length === 0 ? (
                <EmptyState title="Sin datos" body="Todavia no hay asignaciones confirmadas dentro del rango seleccionado." />
              ) : (
                <Stack spacing={1.5}>
                  {state.topPeople.map((person) => (
                    <Box key={person.label} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                      <Typography>{person.label}</Typography>
                      <Typography color="text.secondary">{person.count}</Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </FormCard>

            <FormCard title="Resumen por zona" description="Cobertura y carga pendiente agrupadas por zona.">
              {state.zoneSummary.length === 0 ? (
                <EmptyState title="Sin datos" body="No hay turnos en el rango seleccionado." />
              ) : (
                <Stack spacing={1.5}>
                  {state.zoneSummary.map((zone) => (
                    <Box key={zone.label} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Typography variant="h6">{zone.label}</Typography>
                      <Typography color="text.secondary">
                        Total {zone.total} · cubiertos {zone.covered} · con pendientes {zone.pending}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </FormCard>
          </Box>

          <FormCard title="Reporte por turno" description="Vista compacta para lectura operativa del rango seleccionado.">
            {state.reportRows.length === 0 ? (
              <EmptyState title="Sin turnos" body="No hay turnos en el rango seleccionado." />
            ) : (
              <Stack spacing={1.5}>
                {state.reportRows.map((row) => (
                  <Card key={row.id} elevation={0} sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", backgroundColor: "background.default" }}>
                    <CardContent>
                      <Stack spacing={0.5}>
                        <Typography variant="h6">{row.zoneName}</Typography>
                        <Typography color="text.secondary">
                          {row.dateLabel} · {row.timeLabel}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Estado {row.status} · pendientes {row.pendingCount} · confirmados {row.confirmedCount}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </FormCard>
        </AdminPageShell>
      </Container>
    </Box>
  );
}
