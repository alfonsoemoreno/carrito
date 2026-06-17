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

const entryPoint = {
  href: "/solicitar",
  icon: <EventAvailableRoundedIcon />,
  title: "Solicitar turnos",
  body: "Revise los turnos disponibles y envíe una solicitud en pocos pasos.",
} as const;

export default function HomePage() {
  return (
    <PublicSiteShell>
      <Box component="main" sx={{ py: { xs: 4, md: 5 } }}>
        <Container maxWidth="sm">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Card
              elevation={0}
              sx={{
                background:
                  "linear-gradient(135deg, rgba(91,120,182,0.14), rgba(255,255,255,0.98) 65%)",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.75,
                    alignItems: "flex-start",
                  }}
                >
                  <Typography variant="h3" sx={{ maxWidth: 520 }}>
                    Elige lo que necesitas hacer
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    El acceso público se centra solo en solicitar turnos con el
                    menor número posible de pasos.
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card
              elevation={0}
              sx={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,246,252,0.96))",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ color: "primary.main" }}>{entryPoint.icon}</Box>
                  <Typography variant="h5">{entryPoint.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {entryPoint.body}
                  </Typography>
                  <Link href={entryPoint.href}>
                    <Button variant="contained" fullWidth>
                      Empezar
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
