import { Box, Button, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";
import { PublicNav } from "@/components/public/public-nav";

export function PublicSiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Box component="header" sx={{ backgroundColor: "var(--app-header)", color: "#fff" }}>
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
            <Link href="/" style={{ color: "inherit" }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Box className="app-brand-mark">CA</Box>
                <Box>
                  <Typography variant="h5" sx={{ color: "#fff", lineHeight: 1.1 }}>
                    Carrito
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)" }}>
                    Gestión de turnos de publicaciones
                  </Typography>
                </Box>
              </Stack>
            </Link>

            <Link href="/admin" style={{ color: "inherit" }}>
              <Button
                variant="outlined"
                sx={{
                  borderColor: "rgba(255,255,255,0.22)",
                  color: "#fff !important",
                  display: "inline-flex",
                  alignSelf: { xs: "stretch", md: "auto" },
                  px: 2.5,
                  backgroundColor: "transparent !important",
                }}
              >
                Iniciar sesión
              </Button>
            </Link>
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
            <PublicNav />
          </Container>
        </Box>
      </Box>

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
