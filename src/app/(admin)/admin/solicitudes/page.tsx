import { RequestsInbox } from "@/components/admin/requests-inbox";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { ActionSubmitButton } from "@/components/feedback/action-submit-button";
import { EmptyState } from "@/components/admin/master-data-cards";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";
import {
  getAdminAssignmentOverview,
  getAdminRequestsPageState,
} from "@/features/admin/assignment/queries";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminRequestsPage({ searchParams }: Props) {
  await requireCurrentAdminPageAccess();
  const [overview, state] = await Promise.all([
    getAdminAssignmentOverview(),
    getAdminRequestsPageState(searchParams),
  ]);

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <AdminPageShell
          eyebrow="Operación"
          title="Bandeja de solicitudes"
          description="Encuentra los turnos que necesitan atención, compara solicitantes y coordina cambios de lugar por WhatsApp."
        >
          {state.notice ? (
            <Alert severity="success">{state.notice}</Alert>
          ) : null}
          {state.error ? <Alert severity="error">{state.error}</Alert> : null}

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: { xs: 1, md: 2 } }}>
            {[
              ["Turnos por resolver", overview.pendingShifts],
              ["Solicitudes pendientes", overview.pendingRequests],
              ["Turnos confirmados", overview.confirmedAssignments],
            ].map(([label, count]) => (
              <Box key={label} sx={{ p: { xs: 1.5, md: 2 }, border: "1px solid", borderColor: "divider", borderTop: "3px solid", borderTopColor: "primary.main" }}>
                <Typography variant="h4" component="p">{count}</Typography>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
              </Box>
            ))}
          </Box>

          <Card
            sx={{
              borderRadius: 0,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent>
              <Stack spacing={2.5}>
                <Typography variant="subtitle1">Lugar y estado</Typography>
                <form action="/admin/solicitudes">
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel id="zone-filter-label">Lugar</InputLabel>
                      <Select
                        labelId="zone-filter-label"
                        name="zoneId"
                        defaultValue={state.filters.zoneId}
                        label="Lugar"
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {state.zones.map((zone) => (
                          <MenuItem key={zone.id} value={zone.id}>
                            {zone.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel id="pending-filter-label">Estado</InputLabel>
                      <Select
                        labelId="pending-filter-label"
                        name="onlyPending"
                        defaultValue={state.filters.onlyPending}
                        label="Estado"
                      >
                        <MenuItem value="true">
                          Solo turnos con pendientes
                        </MenuItem>
                        <MenuItem value="false">
                          Todos los turnos filtrados
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <ActionSubmitButton
                      variant="outlined"
                      loadingMessage="Estamos filtrando la bandeja."
                    >
                      Aplicar
                    </ActionSubmitButton>
                  </Stack>
                </form>
              </Stack>
            </CardContent>
          </Card>

          {state.shifts.length === 0 ? (
            <EmptyState
              title="Sin turnos para revisar"
              body="No hay solicitudes pendientes con los filtros actuales."
            />
          ) : (
            <RequestsInbox key={`${state.filters.zoneId}-${state.filters.onlyPending}`} shifts={state.shifts} />
          )}
        </AdminPageShell>
      </Container>
    </Box>
  );
}
