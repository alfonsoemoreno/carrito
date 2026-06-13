import { Box, Container, Stack, Typography } from "@mui/material";
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
        description: "Entre al panel de gestión y reportes.",
      },
      {
        href: "/auth/sign-in",
        label: "Iniciar sesión",
        description: "Acceso de coordinadores y encargados.",
      },
    ],
  },
];

const publicUtilityLinks = [
  { label: "español", href: "/" },
  { label: "Iniciar sesión", href: "/auth/sign-in" },
];

export function PublicSiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AppShellHeader
        brandMark="CA"
        brandTitle="Carrito"
        brandSubtitle="Gestión de turnos de publicaciones"
        homeHref="/"
        sections={publicSections}
        utilityLinks={publicUtilityLinks}
        searchPlaceholder="Buscar"
      />

      {children}

      <Box component="footer" sx={{ mt: 6, py: 4, backgroundColor: "#1a1a1a", color: "#fff" }}>
        <Container maxWidth="lg">
          <Stack spacing={1}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Carrito
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)" }}>
              Plataforma sencilla para consultar turnos, enviar solicitudes y administrar asignaciones.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
