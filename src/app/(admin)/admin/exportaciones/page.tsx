import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { FormCard } from "@/components/admin/master-data-cards";
import { getExportsPageState } from "@/features/admin/exports/queries";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminExportsPage({ searchParams }: Props) {
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
          eyebrow="Fase 8"
          title="Exportaciones"
          description="Descarga datos operativos en CSV compatible con Excel y abre un calendario imprimible por rango."
        >
          <Card sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <form action="/admin/exportaciones">
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
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
                  <input type="date" name="from" defaultValue={state.filters.from} />
                  <input type="date" name="to" defaultValue={state.filters.to} />
                  <Button type="submit" variant="outlined">
                    Aplicar
                  </Button>
                </Stack>
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
        </AdminPageShell>
      </Container>
    </Box>
  );
}
