import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import { Box, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import { RouteButton } from "@/components/navigation/route-button";
import { PublicSiteShell } from "@/components/public/public-site-shell";
import { getCurrentPublicPerson } from "@/features/public/queries";
import { EVENT } from "@/lib/event";

export default async function HomePage() {
  const currentPerson = await getCurrentPublicPerson();

  return (
    <PublicSiteShell>
      <Box component="main" sx={{ py: { xs: 4, md: 7 } }}>
        <Container maxWidth="lg">
          <Stack spacing={{ xs: 3, md: 4 }}>
            <Box className="event-intro" sx={{ maxWidth: 820 }}>
              <Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>
                Coordinación del evento
              </Typography>
              <Typography variant="h2" sx={{ mt: 0.5, fontSize: { xs: "2.1rem", md: "3rem" }, lineHeight: 1.12 }}>
                {EVENT.name}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                {EVENT.location} · {EVENT.dateLabel}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 620 }}>
                Explora el evento, solicita tus turnos y consulta los lugares disponibles.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              <Card elevation={0} sx={{ height: "100%", border: "1px solid var(--app-border)", borderRadius: 0 }}>
                <CardContent sx={{ height: "100%", p: { xs: 2.5, md: 3 }, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1.5 }}>
                  <EventAvailableRoundedIcon color="primary" sx={{ fontSize: 32 }} />
                  <Typography variant="h5">Solicitar turnos</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    Elige un lugar y los horarios que te acomodan.
                  </Typography>
                  <RouteButton href="/solicitar" variant="contained" fullWidth endIcon={<ArrowForwardRoundedIcon />}>
                    {currentPerson ? "Elegir turnos" : "Comenzar"}
                  </RouteButton>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ height: "100%", border: "1px solid var(--app-border)", borderRadius: 0 }}>
                <CardContent sx={{ height: "100%", p: { xs: 2.5, md: 3 }, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1.5 }}>
                  <ManageSearchRoundedIcon color="primary" sx={{ fontSize: 32 }} />
                  <Typography variant="h5">Mis turnos</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {currentPerson
                      ? `Consulta las solicitudes y asignaciones de ${currentPerson.firstName}.`
                      : "Consulta tus solicitudes y asignaciones confirmadas."}
                  </Typography>
                  <RouteButton href="/asignaciones" variant="outlined" fullWidth endIcon={<ArrowForwardRoundedIcon />}>
                    Ver mis turnos
                  </RouteButton>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ height: "100%", border: "1px solid var(--app-border)", borderRadius: 0 }}>
                <CardContent sx={{ height: "100%", p: { xs: 2.5, md: 3 }, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1.5 }}>
                  <MapRoundedIcon color="primary" sx={{ fontSize: 32 }} />
                  <Typography variant="h5">Mapa de lugares</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    Explora los puntos del evento y revisa cómo llegar a cada lugar.
                  </Typography>
                  <RouteButton href="/mapa" variant="outlined" fullWidth endIcon={<ArrowForwardRoundedIcon />}>
                    Ver mapa
                  </RouteButton>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ height: "100%", border: "1px solid var(--app-border)", borderRadius: 0 }}>
                <CardContent sx={{ height: "100%", p: { xs: 2.5, md: 3 }, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1.5 }}>
                  <CalendarMonthRoundedIcon color="primary" sx={{ fontSize: 32 }} />
                  <Typography variant="h5">Calendario de turnos</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    Consulta los horarios disponibles y los lugares que puedes solicitar.
                  </Typography>
                  <RouteButton href="/calendario" variant="outlined" fullWidth endIcon={<ArrowForwardRoundedIcon />}>
                    Ver calendario
                  </RouteButton>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, color: "text.secondary" }}>
              <CalendarMonthRoundedIcon fontSize="small" color="action" />
              <Typography variant="body2">Actividad programada: {EVENT.dateLabel}.</Typography>
            </Box>

            <Box sx={{ pt: 1 }}>
              <RouteButton href="/admin" color="inherit" size="small">
                Acceso para coordinadores
              </RouteButton>
            </Box>
          </Stack>
        </Container>
      </Box>
    </PublicSiteShell>
  );
}
