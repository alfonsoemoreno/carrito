import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import AutoModeRoundedIcon from "@mui/icons-material/AutoModeRounded";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { ModuleLinkCard } from "@/components/admin/master-data-cards";
import { getAdminOverview } from "@/features/admin/master-data/queries";
import {
  Box,
  Container,
  Typography,
} from "@mui/material";

const modules = [
  {
    href: "/admin/personas",
    title: "Personas",
    description: "Alta de publicadores, cambios de estado y reseteo de PIN.",
    badge: "Fase 4",
  },
  {
    href: "/admin/relaciones",
    title: "Relaciones",
    description: "Matrimonios, padre/madre-hijo/hija y excepciones administrativas.",
    badge: "Fase 4",
  },
  {
    href: "/admin/zonas",
    title: "Zonas",
    description: "Entidades geografica principales con visibilidad publica configurable.",
    badge: "Fase 4",
  },
  {
    href: "/admin/plantillas",
    title: "Plantillas",
    description: "Horarios recurrentes por zona para generar turnos futuros.",
    badge: "Fase 4",
  },
  {
    href: "/admin/bloqueos",
    title: "Bloqueos",
    description: "Bloqueos por turno, fecha, zona y rango de fechas.",
    badge: "Fase 4",
  },
  {
    href: "/admin/disponibilidad",
    title: "Disponibilidad",
    description: "Ausencias temporales que impactan asignaciones y sugerencias.",
    badge: "Fase 4",
  },
  {
    href: "/admin/solicitudes",
    title: "Solicitudes",
    description: "Bandeja operativa para revisar pendientes y resolver asignaciones por turno.",
    badge: "Fase 6",
  },
  {
    href: "/admin/automatizacion",
    title: "Automatizacion",
    description: "Generacion futura de turnos, recalculo de estados y alertas operativas.",
    badge: "Fase 7",
  },
] as const;

export default async function AdminDashboardPage() {
  const overview = await getAdminOverview();

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <AdminPageShell
          eyebrow="Backoffice"
          title="Dashboard administrativo"
          description="La Fase 4 deja operativos los modulos maestros sobre Neon para administrar la base del sistema."
        >
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 2.5 }}>
            <AdminStatCard
              icon={<Groups2RoundedIcon />}
              label="Personas activas"
              value={`${overview.activePeople}/${overview.people}`}
              helper="Base de publicadores habilitados para solicitudes y asignaciones."
            />
            <AdminStatCard
              icon={<GridViewRoundedIcon />}
              label="Zonas y relaciones"
              value={`${overview.zones} / ${overview.relationships}`}
              helper="Zonas geograficas y relaciones permitidas registradas."
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
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="h4">Modulos maestros</Typography>
            <Typography color="text.secondary">
              Ya estan disponibles los modulos maestros y la primera capa operativa para resolver solicitudes.
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 2.5 }}>
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
