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

const highlights = [
  "Acceso publico por persona + PIN",
  "Backoffice con Neon Auth para administradores",
  "Solicitudes y consultas conectadas a Neon mediante Prisma",
];

const entryPoints = [
  {
    href: "/solicitar",
    icon: <EventAvailableRoundedIcon />,
    title: "Solicitar turnos",
    body: "Entrada publica para revisar disponibilidad y enviar solicitudes.",
  },
  {
    href: "/asignaciones",
    icon: <AssignmentRoundedIcon />,
    title: "Consultar asignaciones",
    body: "Vista general publica y consulta personal protegida por PIN.",
  },
  {
    href: "/admin",
    icon: <AdminPanelSettingsRoundedIcon />,
    title: "Panel administrativo",
    body: "Base del backoffice protegida con Neon Auth para administradores.",
  },
] as const;

export default function HomePage() {
  return (
    <Box component="main" sx={{ py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
              alignItems: { xs: "flex-start", md: "stretch" },
            }}
          >
            <Card
              elevation={0}
              sx={{
                flex: 1.5,
                borderRadius: 6,
                border: "1px solid",
                borderColor: "divider",
                background:
                  "linear-gradient(135deg, rgba(20,99,86,0.10), rgba(255,250,242,0.95))",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  <Chip
                    label="Fase 5 completada"
                    color="primary"
                    sx={{ alignSelf: "flex-start", fontWeight: 700 }}
                  />
                  <Typography variant="h2" sx={{ maxWidth: 720 }}>
                    Carrito ya opera el flujo publico y el backoffice base.
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    La instalacion actual ya incluye modulos maestros administrativos,
                    autenticacion Neon para backoffice y acceso publico por persona
                    + PIN para solicitar y consultar turnos.
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 1.5,
                    }}
                  >
                    <Link href="/solicitar">
                      <Button size="large" variant="contained">
                        Ver flujo publico
                      </Button>
                    </Link>
                    <Link href="/admin">
                      <Button size="large" variant="outlined">
                        Abrir backoffice
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
                borderRadius: 6,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "background.paper",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography variant="overline" color="primary.main">
                    Bootstrap actual
                  </Typography>
                  {highlights.map((item) => (
                    <Box
                      key={item}
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <PlaceRoundedIcon color="primary" fontSize="small" />
                      <Typography variant="body2">{item}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Card elevation={0} sx={{ borderRadius: 6, border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Typography variant="h4">Puntos de entrada iniciales</Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 2,
                  }}
                >
                  {entryPoints.map((item) => (
                    <Card
                      key={item.href}
                      elevation={0}
                      sx={{
                        flex: 1,
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "background.default",
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <Box sx={{ color: "primary.main" }}>{item.icon}</Box>
                          <Typography variant="h5">{item.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.body}
                          </Typography>
                          <Divider />
                          <Link href={item.href}>
                            <Button variant="text" sx={{ px: 0 }}>
                              Abrir
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
  );
}
