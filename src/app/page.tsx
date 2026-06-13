import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { PublicSiteShell } from "@/components/public/public-site-shell";

const highlights = [
  "Consulta personal mediante PIN",
  "Solicitud de turnos desde un flujo guiado",
  "Administración segura para coordinadores y encargados",
];

const entryPoints = [
  {
    href: "/solicitar",
    icon: <EventAvailableRoundedIcon />,
    title: "Solicitar turnos",
    body: "Revise los turnos disponibles y envíe una solicitud en pocos pasos.",
  },
  {
    href: "/asignaciones",
    icon: <AssignmentRoundedIcon />,
    title: "Consultar asignaciones",
    body: "Consulte asignaciones visibles y revise su historial reciente.",
  },
  {
    href: "/admin",
    icon: <AdminPanelSettingsRoundedIcon />,
    title: "Panel administrativo",
    body: "Administre personas, zonas, solicitudes y reportes desde el panel.",
  },
] as const;

export default function HomePage() {
  return (
    <PublicSiteShell>
      <Box component="main" sx={{ py: { xs: 4, md: 8 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 3, md: 4 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.55fr) minmax(320px, 0.9fr)" },
              gap: { xs: 2, md: 3 },
              alignItems: "stretch",
            }}
          >
            <Card
              elevation={0}
              sx={{
                flex: 1.5,
                background:
                  "linear-gradient(135deg, rgba(91,120,182,0.16), rgba(255,255,255,0.98) 62%)",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.75 } }}>
                  <Chip
                    label="Acceso rápido"
                    color="primary"
                    sx={{ alignSelf: "flex-start", fontWeight: 700 }}
                  />
                  <Typography variant="h2" sx={{ maxWidth: 720 }}>
                    Un flujo claro para consultar turnos, pedir cambios y administrar asignaciones.
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    La aplicación está organizada para que cualquier publicador encuentre su turno rápido
                    y para que el equipo administrativo resuelva solicitudes sin fricción.
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 1.5,
                      pt: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Link href="/solicitar">
                      <Button size="large" variant="contained">
                        Solicitar turnos
                      </Button>
                    </Link>
                    <Link href="/asignaciones">
                      <Button size="large" variant="outlined">
                        Ver asignaciones
                      </Button>
                    </Link>
                    <Link href="/admin">
                      <Button size="large" variant="outlined">
                        Abrir administración
                      </Button>
                    </Link>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card
              elevation={0}
              sx={{
                flex: 1,
                backgroundColor: "background.paper",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
                  <Typography variant="overline" color="primary.main">
                    Lo que puede hacer aquí
                  </Typography>
                  {highlights.map((item) => (
                    <Box key={item} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <PlaceRoundedIcon color="primary" fontSize="small" />
                      <Typography variant="body2">{item}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Card elevation={0}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Typography variant="h4">Seleccione lo que necesita hacer</Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                    gap: 2,
                  }}
                >
                  {entryPoints.map((item) => (
                    <Card
                      key={item.href}
                      elevation={0}
                      sx={{
                        flex: 1,
                        backgroundColor: "#f7f7f7",
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
                          <Box sx={{ color: "primary.main" }}>{item.icon}</Box>
                          <Typography variant="h5">{item.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.body}
                          </Typography>
                          <Divider />
                          <Link href={item.href}>
                            <Button variant="outlined" fullWidth>
                              Entrar
                            </Button>
                          </Link>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
          </Box>
        </Container>
      </Box>
    </PublicSiteShell>
  );
}
