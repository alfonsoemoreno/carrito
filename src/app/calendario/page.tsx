import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import { Box, Container, Stack, Typography } from "@mui/material";
import { PublicShiftCalendar } from "@/components/public/public-shift-calendar";
import { PublicSiteShell } from "@/components/public/public-site-shell";
import { getPublicCalendarViewData } from "@/features/public/calendar";
import { EVENT } from "@/lib/event";

export const dynamic = "force-dynamic";

export default async function PublicCalendarPage() {
  const { days, shifts } = await getPublicCalendarViewData();

  return (
    <PublicSiteShell>
      <Box component="main" sx={{ py: { xs: 4, md: 5 } }}>
        <Container maxWidth="xl">
          <Stack spacing={{ xs: 2.5, md: 3 }}>
            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                <CalendarMonthRoundedIcon color="primary" />
                <Typography variant="overline" color="text.secondary">{EVENT.location} · {EVENT.dateLabel}</Typography>
              </Stack>
              <Typography variant="h3" sx={{ mb: 1 }}>Calendario de turnos</Typography>
              <Typography color="text.secondary">Selecciona un horario disponible para ver los lugares y solicitar tu turno.</Typography>
            </Box>

            <Box sx={{ border: "1px solid var(--app-border)", bgcolor: "background.paper", p: { xs: 1, sm: 2, md: 2.5 } }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ color: "success.dark", fontWeight: 700 }}>● Disponible</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>● Todo tomado</Typography>
                </Stack>
                <PublicShiftCalendar days={days} shifts={shifts} />
                <Typography variant="caption" color="text.secondary">Los lugares usan el mismo color que en el mapa. En pantallas pequeñas, desliza horizontalmente para ver todos los días.</Typography>
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>
    </PublicSiteShell>
  );
}
