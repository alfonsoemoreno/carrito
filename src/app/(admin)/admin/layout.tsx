import { Box, Container, Typography } from "@mui/material";
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
      { href: "/admin/personas", label: "Personas", description: "Publicadores, estado y PIN." },
      { href: "/admin/relaciones", label: "Relaciones", description: "Parejas permitidas y excepciones." },
      { href: "/admin/zonas", label: "Zonas", description: "Zonas visibles y operativas." },
      { href: "/admin/plantillas", label: "Plantillas", description: "Horarios base para turnos futuros." },
    ],
  },
  {
    label: "Restricciones",
    items: [
      { href: "/admin/bloqueos", label: "Bloqueos", description: "Fechas, zonas y turnos bloqueados." },
      { href: "/admin/disponibilidad", label: "Disponibilidad", description: "Ausencias e indisponibilidades." },
    ],
  },
  {
    label: "Operación",
    items: [
      { href: "/admin/solicitudes", label: "Solicitudes", description: "Revisión diaria de pendientes." },
      { href: "/admin/automatizacion", label: "Automatización", description: "Generación y alertas." },
      { href: "/admin/estadisticas", label: "Estadísticas", description: "KPIs y seguimiento." },
      { href: "/admin/exportaciones", label: "Exportaciones", description: "CSV y calendario imprimible." },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { href: "/admin/cuenta", label: "Sesión", description: "Estado del acceso administrativo." },
      { href: "/account/settings", label: "Cuenta", description: "Ajustes del usuario autenticado." },
    ],
  },
];

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Box sx={{ position: "sticky", top: 0, zIndex: 1100 }}>
        <AppShellHeader
          brandMark="CA"
          brandTitle="Carrito Admin"
          brandSubtitle="Panel administrativo"
          homeHref="/admin"
          sections={adminSections}
          utilityLinks={[
            { label: "Cuenta", href: "/admin/cuenta" },
            { label: "Acceso", href: "/account/settings" },
          ]}
          utilityNote="Gestión centralizada de solicitudes, turnos y reportes"
        />
      </Box>
      <Box component="main">{children}</Box>
      <Box component="footer" sx={{ py: 4, mt: 4, backgroundColor: "#1a1a1a", color: "#fff" }}>
        <Container maxWidth="lg">
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)" }}>
            Acceso protegido para administración de personas, zonas, solicitudes y exportaciones.
          </Typography>
        </Container>
      </Box>
    </>
  );
}
