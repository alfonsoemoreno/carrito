import { Box, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Box component="header" sx={{ position: "sticky", top: 0, zIndex: 1100, backgroundColor: "var(--app-header)", color: "#fff" }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              minHeight: { xs: 104, md: 88 },
              display: "flex",
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
              gap: { xs: 2.5, md: 3 },
              py: { xs: 2.5, md: 2.25 },
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            <Link href="/admin" style={{ color: "inherit" }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Box className="app-brand-mark">CA</Box>
                <Box>
                  <Typography variant="h5" sx={{ color: "#fff", lineHeight: 1.1 }}>
                    Carrito Admin
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)" }}>
                    Panel administrativo
                  </Typography>
                </Box>
              </Stack>
            </Link>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)", display: { xs: "none", md: "block" } }}>
              Gestión centralizada de solicitudes, turnos y reportes
            </Typography>
          </Box>
        </Container>
        <Box
          sx={{
            backgroundColor: "var(--app-nav)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            py: { xs: 1.25, md: 0 },
          }}
        >
          <Container maxWidth="lg">
            <AdminNav />
          </Container>
        </Box>
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
