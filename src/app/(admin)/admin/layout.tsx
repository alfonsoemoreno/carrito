import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { EVENT, EVENT_BRAND_SUBTITLE } from "@/lib/event";
import {
  AppShellHeader,
  type AppShellSection,
} from "@/components/navigation/app-shell-header";
import { getCurrentAdminActorOrNull } from "@/features/admin/master-data/auth";

const adminSections: AppShellSection[] = [
  { label: "Resumen", href: "/admin" },
  { label: "Calendario", href: "/admin/calendario" },
  { label: "Solicitudes", href: "/admin/solicitudes" },
  { label: "Participantes", href: "/admin/personas" },
  {
    label: "Más",
    items: [
      {
        href: "/admin/zonas",
        label: "Lugares",
        description: "Puntos de actividad del evento.",
      },
      {
        href: "/admin/relaciones",
        label: "Relaciones",
        description: "Parejas y excepciones.",
      },
      {
        href: "/admin/plantillas",
        label: "Plantillas",
        description: "Horarios de los turnos.",
      },
      {
        href: "/admin/bloqueos",
        label: "Bloqueos",
        description: "Fechas o turnos que no se usarán.",
      },
      {
        href: "/admin/disponibilidad",
        label: "Disponibilidad",
        description: "Disponibilidad de participantes.",
      },
      {
        href: "/admin/automatizacion",
        label: "Automatización",
        description: "Generación y avisos.",
      },
      {
        href: "/admin/estadisticas",
        label: "Estadísticas",
        description: "KPIs y seguimiento.",
      },
      {
        href: "/admin/exportaciones",
        label: "Exportaciones",
        description: "Descargar o imprimir información.",
      },
      {
        href: "/admin/cuenta",
        label: "Sesión",
        description: "Estado del acceso administrativo.",
      },
      {
        href: "/account/settings",
        label: "Cuenta",
        description: "Ajustes del usuario autenticado.",
      },
    ],
  },
];

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const currentAdmin = await getCurrentAdminActorOrNull();
  const sections =
    currentAdmin?.role === "SUPERADMIN"
      ? adminSections.map((section) =>
          section.label === "Más"
            ? {
                ...section,
                items: [
                  ...(section.items ?? []),
                  {
                    href: "/admin/administradores",
                    label: "Administradores",
                    description: "Conceder o suspender acceso al sistema.",
                  },
                ],
              }
            : section,
        )
      : adminSections;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Box sx={{ position: "sticky", top: 0, zIndex: 1100 }}>
        <AppShellHeader
          brandTitle={EVENT.name}
          brandSubtitle={EVENT_BRAND_SUBTITLE}
          homeHref="/admin"
          sections={sections}
        />
      </Box>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          "& > main": {
            flex: 1,
          },
        }}
      >
        <Box component="main">{children}</Box>
      </Box>
    </Box>
  );
}
