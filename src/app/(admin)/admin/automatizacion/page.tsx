import AutoModeRoundedIcon from "@mui/icons-material/AutoModeRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { EmptyState, FormCard } from "@/components/admin/master-data-cards";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";
import {
  generateMissingFutureShiftsAction,
  refreshShiftStatusesAction,
} from "@/features/admin/automation/actions";
import { getAutomationDashboardData } from "@/features/admin/automation/queries";
import { formatDate } from "@/features/admin/master-data/utils";

export default async function AdminAutomationPage() {
  await requireCurrentAdminPageAccess();
  const data = await getAutomationDashboardData();

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <AdminPageShell
          eyebrow="Automatización"
          title="Automatizacion y reglas"
          description="Mantiene el horizonte de turnos futuros, recalcula estados operativos y concentra alertas de cobertura."
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
              gap: 2.5,
            }}
          >
            <AdminStatCard
              icon={<AutoModeRoundedIcon />}
              label="Pendientes por cubrir"
              value={data.alerts.uncoveredShifts}
              helper="Turnos abiertos futuros sin asignacion confirmada."
            />
            <AdminStatCard
              icon={<WarningAmberRoundedIcon />}
              label="Solicitudes pendientes"
              value={data.alerts.pendingRequests}
              helper="Intenciones de participacion que todavia requieren decision administrativa."
            />
            <AdminStatCard
              icon={<WarningAmberRoundedIcon />}
              label="Bloqueados proximos"
              value={data.alerts.blockedUpcomingShifts}
              helper="Turnos futuros bloqueados por reglas manuales de fecha, zona o turno."
            />
            <AdminStatCard
              icon={<AutoModeRoundedIcon />}
              label="Huecos de horizonte"
              value={data.alerts.horizonGapCount}
              helper="Fechas que deberian existir segun plantillas activas y aun no estan generadas."
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
              gap: 2.5,
            }}
          >
            <FormCard
              title="Ejecucion manual"
              description="Permite operar la automatizacion hoy, aun antes de conectar un cron externo."
            >
              <Stack spacing={2}>
                <Typography color="text.secondary">
                  Horizonte visible: {data.config?.visibleWeeks ?? 6} semanas. Horizonte de generacion:{" "}
                  {data.config?.generateFutureWeeks ?? 8} semanas.
                </Typography>
                <Typography color="text.secondary">
                  Modo mantenimiento: {data.config?.maintenanceModeEnabled ? "Activo" : "Inactivo"}.
                </Typography>
                <form action={generateMissingFutureShiftsAction}>
                  <Button type="submit" variant="contained">
                    Generar turnos faltantes ahora
                  </Button>
                </form>
                <form action={refreshShiftStatusesAction}>
                  <Button type="submit" variant="outlined">
                    Recalcular estados operativos
                  </Button>
                </form>
              </Stack>
            </FormCard>

            <FormCard
              title="Restricciones configurables activas"
              description="Estas reglas ya influyen en flujo publico y asignacion administrativa."
            >
              <Stack spacing={1}>
                <Typography variant="body2">Maximo solicitudes por semana: {data.config?.maxRequestsPerWeek ?? 4}</Typography>
                <Typography variant="body2">Maximo confirmados por semana: {data.config?.maxConfirmedPerWeek ?? 2}</Typography>
                <Typography variant="body2">Maximo confirmados por mes: {data.config?.maxConfirmedPerMonth ?? 6}</Typography>
                <Typography variant="body2">Permite dias consecutivos: {data.config?.allowConsecutiveDays ? "Si" : "No"}</Typography>
                <Typography variant="body2">Permite multiples por dia: {data.config?.allowMultiplePerDay ? "Si" : "No"}</Typography>
                <Typography variant="body2">Permite superposiciones: {data.config?.allowOverlapping ? "Si" : "No"}</Typography>
                <Typography variant="body2">Permite pareja por mismo sexo: {data.config?.allowSameSexPairing ? "Si" : "No"}</Typography>
              </Stack>
            </FormCard>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
              gap: 2.5,
            }}
          >
            <FormCard
              title="Alertas operativas"
              description="Foco rapido sobre lo que requiere accion humana inmediata."
            >
              {data.upcomingFocusShifts.length === 0 ? (
                <EmptyState
                  title="Sin alertas inmediatas"
                  body="No se detectaron turnos proximos con bloqueos, pendientes o falta de cobertura."
                />
              ) : (
                <Stack spacing={2}>
                  {data.upcomingFocusShifts.map((shift) => (
                    <Card
                      key={shift.id}
                      elevation={0}
                      sx={{
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "background.default",
                      }}
                    >
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Box>
                            <Typography variant="h6">{shift.zoneName}</Typography>
                            <Typography color="text.secondary">
                              {shift.dateLabel} · {shift.timeLabel}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                            <Chip label={shift.status} size="small" />
                            <Chip label={`${shift.pendingCount} pendientes`} size="small" variant="outlined" />
                            <Chip label={`${shift.confirmedCount} confirmados`} size="small" variant="outlined" />
                          </Stack>
                          <Link href={`/admin/turnos/${shift.id}`}>
                            <Button variant="outlined">Abrir turno</Button>
                          </Link>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </FormCard>

            <FormCard
              title="Huecos detectados en plantillas"
              description="Plantillas activas cuyo horizonte futuro todavia no esta completamente materializado."
            >
              {data.horizonGaps.length === 0 ? (
                <EmptyState
                  title="Horizonte completo"
                  body="Todas las plantillas activas ya tienen sus fechas futuras generadas dentro del horizonte configurado."
                />
              ) : (
                <Stack spacing={1.5}>
                  {data.horizonGaps.map((gap) => (
                    <Box
                      key={gap.templateId}
                      sx={{
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor: "divider",
                        p: 2,
                      }}
                    >
                      <Typography variant="h6">{gap.zoneName}</Typography>
                      <Typography color="text.secondary">
                        Faltan {gap.missingCount} fechas
                        {gap.nextMissingDate ? ` · siguiente: ${formatDate(gap.nextMissingDate)}` : ""}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </FormCard>
          </Box>
        </AdminPageShell>
      </Container>
    </Box>
  );
}
