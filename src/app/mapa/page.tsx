import { Box, Container, Stack, Typography } from "@mui/material";
import { PlacesExplorer } from "@/components/maps/places-explorer";
import { PublicSiteShell } from "@/components/public/public-site-shell";
import { getMapPlaces } from "@/features/public/map-queries";

export const dynamic = "force-dynamic";

export default async function PlacesMapPage() {
  const places = await getMapPlaces();
  return (
    <PublicSiteShell>
      <Box component="main" sx={{ py: { xs: 4, md: 5 } }}>
        <Container maxWidth="lg">
          <Stack spacing={3}>
            <Box>
              <Typography variant="overline" color="text.secondary">Explora Valdivia</Typography>
              <Typography variant="h3" sx={{ mt: 0.5, mb: 1 }}>Encuentra tu lugar</Typography>
              <Typography color="text.secondary">Descubre los puntos del evento, revisa sus detalles y encuentra cómo llegar.</Typography>
            </Box>
            <PlacesExplorer places={places} />
          </Stack>
        </Container>
      </Box>
    </PublicSiteShell>
  );
}
