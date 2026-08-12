import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { PublicSiteShell } from "@/components/public/public-site-shell";

const entryPoint = {
  href: "/solicitar",
  icon: <EventAvailableRoundedIcon />,
  title: "Solicitar turnos",
  body: "Revise los turnos disponibles y envíe una solicitud en pocos pasos.",
} as const;

export default function HomePage() {
  return (
    <PublicSiteShell>
      <Box component="main" sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="sm">
          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 3, md: 4 } }}>
            <Box sx={{ maxWidth: 580 }}>
              <Typography variant="overline" color="primary.main">
                Predicación pública
              </Typography>
              <Typography variant="h2" sx={{ mt: 0.75 }}>
                Organiza tus turnos con tranquilidad.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5 }}>
                Consulta disponibilidad, solicita un turno y revisa tus
                asignaciones desde un mismo lugar.
              </Typography>
            </Box>
            <Card
              elevation={0}
              sx={{
                border: "1px solid var(--app-border)",
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--app-surface) 94%, var(--app-accent) 6%), var(--app-surface-muted))",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 3,
                      color: "primary.main",
                      backgroundColor: "rgba(11, 87, 208, 0.12)",
                    }}
                  >
                    {entryPoint.icon}
                  </Box>
                  <Typography variant="h5">{entryPoint.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {entryPoint.body}
                  </Typography>
                  <Link href={entryPoint.href}>
                    <Button variant="contained" fullWidth endIcon={<ArrowForwardRoundedIcon />}>
                      Ver turnos disponibles
                    </Button>
                  </Link>
                  <Link href="/admin">
                    <Button variant="outlined" fullWidth>
                      Acceso administrativo
                    </Button>
                  </Link>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </Box>
    </PublicSiteShell>
  );
}
