import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import AssignmentLateRoundedIcon from "@mui/icons-material/AssignmentLateRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
} from "@mui/material";

const cards = [
  {
    title: "Solicitudes pendientes",
    body: "Se conectara en la Fase 6 con la bandeja y la vista de asignacion por turno.",
    icon: <AssignmentLateRoundedIcon color="primary" />,
  },
  {
    title: "Turnos con vacantes",
    body: "Aqui se mostraran los turnos abiertos y los bloqueos relevantes.",
    icon: <EventBusyRoundedIcon color="primary" />,
  },
  {
    title: "Participacion y equidad",
    body: "Modulo reservado para metricas de 30/90 dias, historial y casos sin asignacion.",
    icon: <Groups2RoundedIcon color="primary" />,
  },
  {
    title: "Estadisticas",
    body: "Base del tablero administrativo que se completara en la Fase 8.",
    icon: <AnalyticsRoundedIcon color="primary" />,
  },
];

export default function AdminDashboardPage() {
  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="overline" color="primary.main">
              Backoffice
            </Typography>
            <Typography variant="h3">Dashboard administrativo base</Typography>
            <Typography color="text.secondary">
              Esta pagina ya queda bajo la ruta protegida del panel. En fases
              posteriores se conectara con Neon Auth real, datos de Neon y
              modulos del dominio.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5 }}>
            {cards.map((card) => (
              <Box
                key={card.title}
                sx={{ width: { xs: "100%", md: "calc(50% - 10px)" } }}
              >
                <Card
                  elevation={0}
                  sx={{ height: "100%", borderRadius: 5, border: "1px solid", borderColor: "divider" }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {card.icon}
                      <Typography variant="h5">{card.title}</Typography>
                      <Typography color="text.secondary">{card.body}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
