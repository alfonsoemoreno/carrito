import { Box } from "@mui/material";
import type { ReactNode } from "react";
import {
  AppShellHeader,
  type AppShellSection,
} from "@/components/navigation/app-shell-header";
import { AppShellFooter as Footer } from "@/components/navigation/app-shell-footer";

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

const publicUtilityLinks = [
  { label: "español", href: "/" },
  { label: "Acceso admin", href: "/auth/sign-in" },
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
        utilityLinks={publicUtilityLinks}
        searchPlaceholder="Buscar"
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

      <Footer
        eyebrow="Carrito / Plataforma de turnos"
        title="Accesos, ayuda y operaciones principales."
        columns={[
          {
            title: "Servicios",
            links: [
              { href: "/solicitar", label: "Solicitar turnos" },
              { href: "/asignaciones", label: "Consultar asignaciones" },
            ],
          },
          {
            title: "Administración",
            links: [
              { href: "/admin", label: "Panel administrativo" },
              { href: "/auth/sign-in", label: "Acceso administrativo" },
            ],
          },
          {
            title: "Soporte",
            links: [
              { href: "/auth/sign-in", label: "Acceso administrativo" },
              { href: "/asignaciones", label: "Ver estado de asignaciones" },
            ],
          },
          {
            title: "Enlaces directos",
            links: [
              { href: "/", label: "Inicio" },
              { href: "/solicitar", label: "Flujo público" },
              { href: "/admin/cuenta", label: "Estado de sesión" },
            ],
          },
        ]}
        productLinks={[
          { href: "/", label: "Carrito" },
          { href: "/admin", label: "Panel" },
        ]}
        legalLinks={[
          { href: "/", label: "Condiciones de uso" },
          { href: "/", label: "Privacidad" },
        ]}
        copyright="© 2026 Carrito."
      />
    </Box>
  );
}
