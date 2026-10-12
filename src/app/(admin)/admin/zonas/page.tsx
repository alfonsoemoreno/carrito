import {
  deleteZoneAction,
  updateZoneVisibilityAction,
} from "@/features/admin/master-data/actions";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import {
  EmptyState,
} from "@/components/admin/master-data-cards";
import Link from "next/link";
import { ZoneEditor } from "@/components/admin/zone-editor";
import { hasCoordinates } from "@/lib/places-map";
import { prisma } from "@/lib/prisma";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { ActionSubmitButton } from "@/components/feedback/action-submit-button";

export default async function AdminZonesPage() {
  await requireCurrentAdminPageAccess();
  const zones = await prisma.zone.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          templates: true,
          shifts: true,
          blocks: true,
        },
      },
    },
  });

  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <AdminPageShell
        eyebrow="Lugares"
        title="Gestion de lugares"
        description="Define los lugares principales y su visibilidad publica."
      >
        <Card>
          <CardContent>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
              <Box>
                <Typography variant="h5">Ubica los puntos del evento</Typography>
                <Typography color="text.secondary">Agrega un lugar y sitúalo en el mapa con un clic o arrastrando el pin.</Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <ZoneEditor />
                <Button component={Link} href="/admin/mapa" variant="outlined">Ver mapa</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {zones.length === 0 ? (
          <EmptyState
            title="Sin lugares"
            body="Crea el primer lugar para poder asociar plantillas y turnos."
          />
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "repeat(2, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {zones.map((zone) => (
              <Card
                key={zone.id}
                sx={{
                  borderRadius: 0,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <CardContent>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="h5">{zone.name}</Typography>
                        <Typography color="text.secondary">
                          {zone.description || "Sin descripcion."}
                        </Typography>
                      </Box>
                      <Chip
                        label={zone.status === "ACTIVE" ? "Activa" : "Inactiva"}
                        color={zone.status === "ACTIVE" ? "success" : "default"}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {zone.address || "Sin dirección de referencia"}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Box sx={{ width: 16, height: 16, bgcolor: zone.mapColor }} />
                      <Typography variant="caption" color="text.secondary">
                        {hasCoordinates(zone) ? `${zone.latitude}, ${zone.longitude}` : "Ubicación pendiente"}
                      </Typography>
                    </Stack>
                    <ZoneEditor zone={{ id: zone.id, name: zone.name, description: zone.description,
                      address: zone.address, latitude: zone.latitude, longitude: zone.longitude,
                      mapColor: zone.mapColor, status: zone.status, publicVisible: zone.publicVisible }} />
                    <Typography variant="body2" color="text.secondary">
                      {zone.publicVisible ? "Visible" : "Oculta"} ·{" "}
                      {zone._count.templates} plantillas · {zone._count.shifts}{" "}
                      turnos · {zone._count.blocks} bloqueos
                    </Typography>
                    <form action={updateZoneVisibilityAction}>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                        <input type="hidden" name="id" value={zone.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={zone.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
                        />
                        <input
                          type="hidden"
                          name="publicVisible"
                          value={zone.publicVisible ? "false" : "true"}
                        />
                        <ActionSubmitButton
                          variant="outlined"
                          loadingMessage="Estamos actualizando el lugar."
                        >
                          {zone.status === "ACTIVE" ? "Desactivar" : "Activar"} y{" "}
                          {zone.publicVisible ? "ocultar" : "mostrar"}
                        </ActionSubmitButton>
                      </Box>
                    </form>
                    <form action={deleteZoneAction}>
                      <input type="hidden" name="id" value={zone.id} />
                      <ActionSubmitButton
                        variant="contained"
                        color="error"
                        loadingMessage="Estamos eliminando el lugar y sus registros asociados."
                      >
                        Eliminar lugar y registros asociados
                      </ActionSubmitButton>
                    </form>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </AdminPageShell>
    </Container>
  );
}
