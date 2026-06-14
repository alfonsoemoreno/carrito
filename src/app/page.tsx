import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
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
    title: "Ver asignaciones",
    body: "Consulte las asignaciones visibles y revise su seguimiento personal.",
  },
] as const;

export default function HomePage() {
  return (
    <PublicSiteShell>
      <Box component="main" sx={{ py: { xs: 4, md: 8 } }}>
        <Container maxWidth="md">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Card
              elevation={0}
              sx={{
                background:
                  "linear-gradient(135deg, rgba(91,120,182,0.14), rgba(255,255,255,0.98) 65%)",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2.25,
                    alignItems: "flex-start",
                  }}
                >
                  <Typography variant="h2" sx={{ maxWidth: 680 }}>
                    Elige lo que necesitas hacer
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    El acceso público se centra solo en solicitar turnos y
                    revisar asignaciones visibles.
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              {entryPoints.map((item) => (
                <Card
                  key={item.href}
                  elevation={0}
                  sx={{
                    backgroundColor: "#f7f7f7",
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      <Box sx={{ color: "primary.main" }}>{item.icon}</Box>
                      <Typography variant="h4">{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.body}
                      </Typography>
                      <Link href={item.href}>
                        <Button variant="contained" fullWidth>
                          Entrar
                        </Button>
                      </Link>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>
    </PublicSiteShell>
  );
}
