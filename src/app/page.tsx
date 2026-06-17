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
                border: "1px solid var(--app-border)",
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--app-surface) 94%, var(--app-accent) 6%), var(--app-surface-muted))",
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
                  <Link href="/admin">
                    <Button variant="outlined" fullWidth>
                      Ir a administración
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
