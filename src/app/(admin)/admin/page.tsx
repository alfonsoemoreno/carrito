import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import AutoModeRoundedIcon from "@mui/icons-material/AutoModeRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { ModuleLinkCard } from "@/components/admin/master-data-cards";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";
import { getAdminOverview } from "@/features/admin/master-data/queries";
import { Box, Container, Typography } from "@mui/material";

const modules = [
  {
    href: "/admin/personas",
    title: "Personas",
    description: "Alta de publicadores y cambios de estado.",
    badge: "Maestro",
  },
  {
    href: "/admin/relaciones",
    title: "Relaciones",
    description:
      "Matrimonios, padre/madre-hijo/hija y excepciones administrativas.",
    badge: "Maestro",
  },
  {
    href: "/admin/zonas",
    title: "Lugares",
    description: "Lugares principales con visibilidad publica configurable.",
    badge: "Maestro",
  },
  {
    href: "/admin/plantillas",
    title: "Plantillas",
    description: "Horarios recurrentes por lugar para generar turnos futuros.",
    badge: "Maestro",
  },
  {
    href: "/admin/bloqueos",
    title: "Bloqueos",
    description: "Bloqueos por turno, fecha, lugar y rango de fechas.",
    badge: "Operación",
  },
  {
    href: "/admin/disponibilidad",
    title: "Disponibilidad",
    description:
      "Ausencias temporales que impactan asignaciones y sugerencias.",
    badge: "Operación",
  },
  {
    href: "/admin/solicitudes",
    title: "Solicitudes",
    description:
      "Bandeja operativa para revisar pendientes y resolver asignaciones por turno.",
    badge: "Revisión",
  },
  {
    href: "/admin/automatizacion",
    title: "Automatizacion",
    description:
      "Generacion futura de turnos, recalculo de estados y alertas operativas.",
    badge: "Automático",
  },
  {
    href: "/admin/estadisticas",
    title: "Estadisticas",
    description:
      "KPIs operativos y reportes por rango sobre cobertura, solicitudes y turnos.",
    badge: "Reporte",
  },
  {
    href: "/admin/exportaciones",
    title: "Exportaciones",
    description:
      "CSV compatibles con Excel y calendario imprimible para operacion y archivo.",
    badge: "Reporte",
  },
] as const;

export default async function AdminDashboardPage() {
  await requireCurrentAdminPageAccess();
  const overview = await getAdminOverview();

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <AdminPageShell
          eyebrow="Panel administrativo"
          title="Resumen general"
          description="Revise el estado del sistema y entre rápidamente a los módulos que necesita usar hoy."
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(4, minmax(0, 1fr))",
              },
              gap: 2.5,
            }}
          >
            <AdminStatCard
              icon={<Groups2RoundedIcon />}
              label="Personas activas"
              value={`${overview.activePeople}/${overview.people}`}
              helper="Base de publicadores habilitados para solicitudes y asignaciones."
            />
            <AdminStatCard
              icon={<GridViewRoundedIcon />}
              label="Lugares y relaciones"
              value={`${overview.zones} / ${overview.relationships}`}
              helper="Lugares y relaciones permitidas registradas."
            />
            <AdminStatCard
              icon={<ScheduleRoundedIcon />}
              label="Plantillas y turnos abiertos"
              value={`${overview.templates} / ${overview.openShifts}`}
              helper="Plantillas recurrentes y turnos actualmente abiertos."
            />
            <AdminStatCard
              icon={<VisibilityOffRoundedIcon />}
              label="Pendientes y restricciones"
              value={`${overview.pendingRequests} / ${overview.blocks + overview.availability}`}
              helper="Solicitudes pendientes y restricciones manuales que afectan la planificacion."
            />
            <AdminStatCard
              icon={<AutoModeRoundedIcon />}
              label="Cobertura operativa"
              value={`${overview.shiftsWithPendingRequests} / ${overview.blockedUpcomingShifts}`}
              helper="Turnos con pendientes y bloqueos futuros que requieren seguimiento."
            />
            <AdminStatCard
              icon={<BarChartRoundedIcon />}
              label="Foco analitico"
              value={`${overview.pendingRequests} / ${overview.openShifts}`}
              helper="Base inmediata para reportes de solicitudes versus turnos abiertos."
            />
            <AdminStatCard
              icon={<DownloadRoundedIcon />}
              label="Base exportable"
              value={`${overview.people} / ${overview.zones}`}
              helper="Volumen base de personas y lugares para reportes y exportaciones."
            />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="h4">Modulos maestros</Typography>
            <Typography color="text.secondary">
              Acceda a los catálogos, la operación diaria y los reportes desde
              un mismo lugar.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2.5,
            }}
          >
            {modules.map((module) => (
              <Box key={module.href}>
                <ModuleLinkCard
                  href={module.href}
                  title={module.title}
                  description={module.description}
                  badge={module.badge}
                />
              </Box>
            ))}
          </Box>
        </AdminPageShell>
      </Container>
    </Box>
  );
}
