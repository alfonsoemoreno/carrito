import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { FormCard } from "@/components/admin/master-data-cards";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";
import { getExportsPageState } from "@/features/admin/exports/queries";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminExportsPage({ searchParams }: Props) {
  await requireCurrentAdminPageAccess();
  const state = await getExportsPageState(searchParams);
  const query = new URLSearchParams({
    from: state.filters.from,
    to: state.filters.to,
    ...(state.filters.zoneId ? { zoneId: state.filters.zoneId } : {}),
  }).toString();

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <AdminPageShell
          eyebrow="Reportes"
          title="Exportaciones"
          description="Descarga datos operativos en CSV compatible con Excel y abre un calendario imprimible por rango."
        >
          <Card sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <form action="/admin/exportaciones">
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
                    gap: 2,
                    alignItems: { md: "end" },
                  }}
                >
                  <FormControl fullWidth>
                    <InputLabel id="exports-zone-label">Zona</InputLabel>
                    <Select labelId="exports-zone-label" name="zoneId" defaultValue={state.filters.zoneId} label="Zona">
                      <MenuItem value="">Todas</MenuItem>
                      {state.zones.map((zone) => (
                        <MenuItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    name="from"
                    type="date"
                    label="Desde"
                    defaultValue={state.filters.from}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                  />
                  <TextField
                    name="to"
                    type="date"
                    label="Hasta"
                    defaultValue={state.filters.to}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                  />
                  <Button type="submit" variant="outlined" sx={{ minWidth: 140 }}>
                    Aplicar
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
              gap: 2.5,
            }}
          >
            <AdminStatCard icon={<DownloadRoundedIcon />} label="Asignaciones" value={state.summary.assignmentCount} helper="Filas que saldrian en la exportacion de asignaciones." />
            <AdminStatCard icon={<DownloadRoundedIcon />} label="Solicitudes" value={state.summary.requestCount} helper="Filas que saldrian en la exportacion de solicitudes." />
            <AdminStatCard icon={<PrintRoundedIcon />} label="Pendientes" value={state.summary.pendingCount} helper="Solicitudes pendientes dentro del filtro actual." />
            <AdminStatCard icon={<PrintRoundedIcon />} label="Confirmadas" value={state.summary.confirmedCount} helper="Asignaciones confirmadas dentro del filtro actual." />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr 1fr" },
              gap: 2.5,
            }}
          >
            <FormCard title="CSV de asignaciones" description="Archivo plano compatible con Excel, Numbers o Google Sheets.">
              <Link href={`/api/exports/assignments?${query}`}>
                <Button variant="contained" startIcon={<DownloadRoundedIcon />}>
                  Descargar asignaciones.csv
                </Button>
              </Link>
            </FormCard>
            <FormCard title="CSV de solicitudes" description="Incluye estado, pareja sugerida y comentario cuando existe.">
              <Link href={`/api/exports/requests?${query}`}>
                <Button variant="contained" startIcon={<DownloadRoundedIcon />}>
                  Descargar solicitudes.csv
                </Button>
              </Link>
            </FormCard>
            <FormCard title="Calendario imprimible" description="Vista HTML optimizada para imprimir desde el navegador.">
              <Link href={`/admin/calendario?${query}`}>
                <Button variant="outlined" startIcon={<PrintRoundedIcon />}>
                  Abrir calendario
                </Button>
              </Link>
            </FormCard>
          </Box>

          <Card sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Typography variant="h5">Auditoria reciente de exportaciones</Typography>
                  <Typography color="text.secondary">
                    Cada descarga CSV queda registrada con administrador, fecha, volumen y contexto basico.
                  </Typography>
                </Box>

                {state.recentExports.length === 0 ? (
                  <Alert severity="info">Aun no hay exportaciones registradas.</Alert>
                ) : (
                  <Stack spacing={1.5}>
                    {state.recentExports.map((entry) => (
                      <Box
                        key={entry.id}
                        sx={{
                          borderRadius: 4,
                          border: "1px solid",
                          borderColor: "divider",
                          p: 2,
                        }}
                      >
                        <Stack spacing={1}>
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={1}
                            sx={{ alignItems: { xs: "flex-start", md: "center" } }}
                          >
                            <Chip size="small" color="primary" label={entry.actionLabel} />
                            <Typography variant="body2" color="text.secondary">
                              {entry.createdAtLabel}
                            </Typography>
                          </Stack>
                          <Typography variant="body1">
                            {entry.actorLabel} descargo <strong>{entry.fileName}</strong> con {entry.rowCount} filas.
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {entry.filtersLabel}
                            {entry.ipAddress ? ` · IP ${entry.ipAddress}` : ""}
                          </Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </AdminPageShell>
      </Container>
    </Box>
  );
}
