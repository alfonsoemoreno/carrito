import { AuthView } from "@neondatabase/auth/react";
import { Alert, Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { PublicSiteShell } from "@/components/public/public-site-shell";

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <PublicSiteShell>
      <Box component="main" sx={{ py: 6 }}>
        <Container maxWidth="md">
          <Card sx={{ maxWidth: 680, mx: "auto" }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={3.5}>
                <Box sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 2 }}>
                  <Typography variant="h4">Acceso administrativo</Typography>
                  <Typography color="text.secondary">
                    Inicie sesión para administrar personas, turnos, solicitudes y reportes internos.
                  </Typography>
                </Box>
                <Alert severity="info">
                  Este acceso es solo para administradores y superadministradores. Si eres publicador y
                  quieres solicitar turnos o revisar asignaciones, usa el flujo público.
                </Alert>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                  <Link href="/solicitar">
                    <Button variant="outlined">Ir a solicitar turnos</Button>
                  </Link>
                  <Link href="/asignaciones">
                    <Button variant="outlined">Ver asignaciones</Button>
                  </Link>
                </Box>
                <Box className="auth-panel">
                  <AuthView path={path} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </PublicSiteShell>
  );
}
