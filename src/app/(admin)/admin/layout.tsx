import { Box } from "@mui/material";
import type { ReactNode } from "react";
import {
  AppShellHeader,
  type AppShellSection,
} from "@/components/navigation/app-shell-header";

const adminSections: AppShellSection[] = [
  { label: "Resumen", href: "/admin" },
  {
    label: "Maestros",
    items: [
      {
        href: "/admin/personas",
        label: "Personas",
        description: "Publicadores y estado.",
      },
      {
        href: "/admin/relaciones",
        label: "Relaciones",
        description: "Parejas permitidas y excepciones.",
      },
      {
        href: "/admin/zonas",
        label: "Lugares",
        description: "Lugares visibles y operativos.",
      },
      {
        href: "/admin/plantillas",
        label: "Plantillas",
        description: "Horarios base para turnos futuros.",
      },
    ],
  },
  {
    label: "Restricciones",
    items: [
      {
        href: "/admin/bloqueos",
        label: "Bloqueos",
        description: "Fechas, lugares y turnos bloqueados.",
      },
      {
        href: "/admin/disponibilidad",
        label: "Disponibilidad",
        description: "Ausencias e indisponibilidades.",
      },
    ],
  },
  {
    label: "Operación",
    items: [
      {
        href: "/admin/solicitudes",
        label: "Solicitudes",
        description: "Revisión diaria de pendientes.",
      },
      {
        href: "/admin/automatizacion",
        label: "Automatización",
        description: "Generación y alertas.",
      },
      {
        href: "/admin/estadisticas",
        label: "Estadísticas",
        description: "KPIs y seguimiento.",
      },
      {
        href: "/admin/exportaciones",
        label: "Exportaciones",
        description: "CSV y calendario imprimible.",
      },
    ],
  },
  {
    label: "Cuenta",
    items: [
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

export default function AdminLayout({ children }: { children: ReactNode }) {
  const congregationName = process.env.CONGREGATION_NAME ?? "Sin configurar";

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Box sx={{ position: "sticky", top: 0, zIndex: 1100 }}>
        <AppShellHeader
          brandTitle="Predicación pública"
          brandSubtitle={`Congregación ${congregationName}`}
          homeHref="/admin"
          sections={adminSections}
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
