import { Box } from "@mui/material";
import type { ReactNode } from "react";
import {
  AppShellHeader,
  type AppShellSection,
} from "@/components/navigation/app-shell-header";

const publicSections: AppShellSection[] = [
  { label: "Inicio", href: "/" },
  {
    label: "Servicios",
    items: [
      {
        href: "/solicitar",
        label: "Solicitar turnos",
        description: "Revise disponibilidad y envíe solicitudes.",
      },
      {
        href: "/asignaciones",
        label: "Asignaciones",
        description: "Consulte asignaciones visibles e historial.",
      },
    ],
  },
  {
    label: "Administración",
    items: [
      {
        href: "/admin",
        label: "Panel administrativo",
        description: "Solo para administradores y superadministradores.",
      },
      {
        href: "/auth/sign-in",
        label: "Acceso administrativo",
        description: "Entrada de coordinadores, encargados y superadmin.",
      },
    ],
  },
];

export function PublicSiteShell({ children }: { children: ReactNode }) {
  const congregationName = process.env.CONGREGATION_NAME ?? "Sin configurar";

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppShellHeader
        brandTitle="Predicación pública"
        brandSubtitle={`Congregación ${congregationName}`}
        homeHref="/"
        sections={publicSections}
      />

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
        {children}
      </Box>
    </Box>
  );
}
