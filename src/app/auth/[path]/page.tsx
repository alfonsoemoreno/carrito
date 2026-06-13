import { AuthView } from "@neondatabase/auth/react";
import { Box, Card, CardContent, Container, Stack, Typography } from "@mui/material";
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
        <Container maxWidth="sm">
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Box sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 2 }}>
                  <Typography variant="h4">Acceso administrativo</Typography>
                  <Typography color="text.secondary">
                    Inicie sesión para administrar personas, turnos, solicitudes y reportes.
                  </Typography>
                </Box>
                <AuthView path={path} />
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </PublicSiteShell>
  );
}
