import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import { Alert, Box, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import { ShiftRequestFlow } from "@/components/public/shift-request-flow";
import { PublicRequestJourney } from "@/components/public/public-request-journey";
import { PublicSiteShell } from "@/components/public/public-site-shell";
import { getSolicitarPageState } from "@/features/public/queries";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SolicitarPage({ searchParams }: Props) {
  const state = await getSolicitarPageState(searchParams);

  return (
    <PublicSiteShell>
      <Box component="main" sx={{ py: { xs: 5, md: 6 } }}>
        <Container maxWidth="lg">
          <Stack spacing={{ xs: 3.5, md: 4.5 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, maxWidth: 700 }}>
              <Typography variant="h3">Solicitar turnos</Typography>
              <Typography variant="body1" color="text.secondary">
                {state.currentPerson
                  ? "Elige un lugar y marca los horarios que te sirven."
                  : "Selecciona tu nombre y sigue los pasos para pedir tus turnos."}
              </Typography>
            </Box>

            {state.notice && state.currentPerson ? <Alert severity="success">{state.notice}</Alert> : null}
            {state.authError ? <Alert severity="error">{state.authError}</Alert> : null}
            {state.eventEnded ? (
              <Alert severity="info">El período del evento ya finalizó. No hay turnos disponibles.</Alert>
            ) : state.config.maintenanceModeEnabled ? (
              <Alert severity="warning">El sistema está en modo mantenimiento. Puedes consultar los turnos, pero no registrar nuevas solicitudes.</Alert>
            ) : null}

            {!state.currentPerson ? (
              <Card elevation={0} sx={{ borderRadius: 0, border: "1px solid", borderColor: "divider" }}>
                <CardContent>
                  <Stack spacing={{ xs: 3.25, md: 4 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <PersonSearchRoundedIcon color="primary" />
                      <Typography variant="h5">Elige tu nombre</Typography>
                    </Stack>
                    <PublicRequestJourney
                  initialSelectedDate={state.filters.selectedDate}
                  initialSelectedShiftId={state.filters.selectedShiftId}
                      initialZoneId={state.filters.zoneId}
                      key={state.sessionResetKey || "public-request-journey"}
                      people={state.people.map((person) => ({ id: person.id, label: `${person.firstName} ${person.lastName}` }))}
                    />
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <ShiftRequestFlow
                zones={state.zones}
                shifts={state.shiftBoard}
                initialZoneId={state.filters.zoneId}
                initialSelectedDate={state.filters.selectedDate}
                initialSelectedShiftId={state.filters.selectedShiftId}
                from={state.filters.from}
                to={state.filters.to}
                maintenanceModeEnabled={state.config.maintenanceModeEnabled || state.eventEnded}
                requestError={state.requestError}
              />
            )}
          </Stack>
        </Container>
      </Box>
    </PublicSiteShell>
  );
}
