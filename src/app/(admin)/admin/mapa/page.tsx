import { Container } from "@mui/material";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { PlacesExplorer } from "@/components/maps/places-explorer";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";
import { getMapPlaces } from "@/features/public/map-queries";

export default async function AdminPlacesMapPage() {
  await requireCurrentAdminPageAccess();
  const places = await getMapPlaces(true);
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <AdminPageShell eyebrow="Lugares" title="Mapa de lugares" description="Consulta todos los puntos, incluidos los ocultos e inactivos, y edita su ubicación.">
        <PlacesExplorer places={places} admin />
      </AdminPageShell>
    </Container>
  );
}
