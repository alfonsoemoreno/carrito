import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/personas", label: "Personas" },
  { href: "/admin/relaciones", label: "Relaciones" },
  { href: "/admin/zonas", label: "Zonas" },
  { href: "/admin/plantillas", label: "Plantillas" },
  { href: "/admin/bloqueos", label: "Bloqueos" },
  { href: "/admin/disponibilidad", label: "Disponibilidad" },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/cuenta", label: "Sesion" },
  { href: "/account/settings", label: "Cuenta" },
] as const;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Toolbar sx={{ minHeight: 72 }}>
          <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 2 } }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <DashboardRoundedIcon color="primary" />
                <Typography variant="h6">Carrito Admin</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{ color: "inherit" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Link>
                ))}
              </Box>
            </Box>
          </Container>
        </Toolbar>
      </AppBar>
      <Box component="main">{children}</Box>
      <Box component="footer" sx={{ py: 3 }}>
        <Container maxWidth="lg">
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}
          >
            <ManageAccountsRoundedIcon fontSize="small" />
            <SettingsRoundedIcon fontSize="small" />
            <Typography variant="caption">
              Layout base de backoffice protegido por Neon Auth.
            </Typography>
          </Box>
        </Container>
      </Box>
    </>
  );
}
