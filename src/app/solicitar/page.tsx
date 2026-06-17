import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { PublicPersonPicker } from "@/components/public/public-person-picker";
import { ActionSubmitButton } from "@/components/feedback/action-submit-button";
import { PublicSiteShell } from "@/components/public/public-site-shell";
import { submitShiftRequestsAction } from "@/features/public/actions";
import { getSolicitarPageState } from "@/features/public/queries";

type ScheduleView = "available" | "confirmed" | "calendar";
type RequestStep = "person" | "zone" | "shifts";

const REQUEST_STEPS: Array<{
  id: RequestStep;
  title: string;
  description: string;
}> = [
  {
    id: "person",
    title: "Tu nombre",
    description: "Identifica quién hará la solicitud.",
  },
  {
    id: "zone",
    title: "Lugar",
    description: "Elige dónde quieres participar.",
  },
  {
    id: "shifts",
    title: "Turnos",
    description: "Selecciona horarios y envía la solicitud.",
  },
];

function buildScheduleHref(
  filters: { zoneId: string; from: string; to: string; selectedDate: string },
  view: ScheduleView,
) {
  const params = new URLSearchParams();

  if (filters.zoneId) {
    params.set("zoneId", filters.zoneId);
  }

  if (filters.from) {
    params.set("from", filters.from);
  }

  if (filters.to) {
    params.set("to", filters.to);
  }

  if (filters.selectedDate) {
    params.set("selectedDate", filters.selectedDate);
  }

  params.set("scheduleView", view);

  return `/solicitar?${params.toString()}`;
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SolicitarPage({ searchParams }: Props) {
  const state = await getSolicitarPageState(searchParams);
  const selectedZone = state.zones.find(
    (zone) => zone.id === state.filters.zoneId,
  );
  const zoneAvailableShifts = state.filters.zoneId
    ? state.shiftBoard.filter(
        (shift) =>
          shift.status === "OPEN" &&
          shift.ownLatestRequest?.status !== "PENDING" &&
          shift.ownLatestRequest?.status !== "CONFIRMED",
      )
    : [];
  const hasAvailableShifts = zoneAvailableShifts.length > 0;
  const requestReturnTo = buildScheduleHref(
    { ...state.filters, selectedDate: "" },
    "available",
  );
  const currentStep: RequestStep = !state.currentPerson
    ? "person"
    : !selectedZone
      ? "zone"
      : "shifts";
  const currentStepIndex = REQUEST_STEPS.findIndex(
    (step) => step.id === currentStep,
  );

  return (
    <PublicSiteShell>
      <Box component="main" sx={{ py: { xs: 4, md: 5 } }}>
        <Container maxWidth="md">
          <Stack spacing={3}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                borderLeft: "4px solid",
                borderColor: "primary.main",
                pl: 2,
              }}
            >
              <Typography variant="h3">Solicitar turnos</Typography>
              <Typography variant="body1" color="text.secondary">
                Selecciona tu usuario, elige un lugar y pide tus turnos en
                pocos pasos.
              </Typography>
            </Box>

            <Card
              elevation={0}
              sx={{
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,250,255,0.95))",
              }}
            >
              <CardContent>
                <Stack spacing={2.25}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.25}
                    sx={{
                      justifyContent: "space-between",
                      alignItems: { xs: "flex-start", md: "center" },
                    }}
                  >
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        Flujo guiado
                      </Typography>
                      <Typography variant="h5">
                        {REQUEST_STEPS[currentStepIndex]?.title}
                      </Typography>
                      <Typography color="text.secondary">
                        {REQUEST_STEPS[currentStepIndex]?.description}
                      </Typography>
                    </Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ flexWrap: "wrap", alignItems: "center" }}
                    >
                      {state.currentPerson ? (
                        <Chip
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={`${state.currentPerson.firstName} ${state.currentPerson.lastName}`}
                        />
                      ) : null}
                      {selectedZone ? (
                        <Chip
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={selectedZone.name}
                        />
                      ) : null}
                    </Stack>
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(3, minmax(0, 1fr))",
                      },
                      gap: 1,
                    }}
                  >
                    {REQUEST_STEPS.map((step, index) => {
                      const active = index === currentStepIndex;
                      const completed = index < currentStepIndex;

                      return (
                        <Box
                          key={step.id}
                          sx={{
                            px: 1.25,
                            py: 1.1,
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: active
                              ? "primary.main"
                              : completed
                                ? "rgba(74,109,167,0.35)"
                                : "divider",
                            backgroundColor: active
                              ? "rgba(74,109,167,0.08)"
                              : completed
                                ? "rgba(74,109,167,0.04)"
                                : "#ffffff",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              fontWeight: 700,
                              color: active || completed
                                ? "primary.main"
                                : "text.secondary",
                            }}
                          >
                            {completed
                              ? "Listo"
                              : active
                                ? "Actual"
                                : "Pendiente"}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: "#1f2a3d" }}
                          >
                            {step.title}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {state.notice ? (
              <Alert severity="success">{state.notice}</Alert>
            ) : null}
            {state.authError ? (
              <Alert severity="error">{state.authError}</Alert>
            ) : null}
            {state.requestError ? (
              <Alert severity="error">{state.requestError}</Alert>
            ) : null}
            {state.config.maintenanceModeEnabled ? (
              <Alert severity="warning">
                El sistema esta en modo mantenimiento. Las consultas publicas
                siguen visibles, pero no se deberian registrar nuevas
                solicitudes hasta desactivar ese modo.
              </Alert>
            ) : null}

            {!state.currentPerson ? (
              <Card
                elevation={0}
                sx={{
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <CardContent>
                  <Stack spacing={3}>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{ alignItems: "center" }}
                    >
                      <PersonSearchRoundedIcon color="primary" />
                      <Typography variant="h5">Elige tu nombre</Typography>
                    </Stack>
                    <PublicPersonPicker
                      people={state.people.map((person) => ({
                        id: person.id,
                        label: `${person.firstName} ${person.lastName}`,
                      }))}
                      selectedPersonId=""
                    />
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={3}>
                {!selectedZone ? (
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <CardContent>
                      <Stack spacing={3}>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          sx={{ alignItems: "center" }}
                        >
                          <EventAvailableRoundedIcon color="primary" />
                          <Typography variant="h5">Elige un lugar</Typography>
                        </Stack>
                        <form action="/solicitar">
                          <Stack spacing={2}>
                            <input
                              type="hidden"
                              name="scheduleView"
                              value="available"
                            />
                            <input
                              type="hidden"
                              name="from"
                              value={state.filters.from}
                            />
                            <input
                              type="hidden"
                              name="to"
                              value={state.filters.to}
                            />
                            <FormControl fullWidth>
                              <InputLabel id="zone-filter-label">
                                Lugar
                              </InputLabel>
                              <Select
                                labelId="zone-filter-label"
                                name="zoneId"
                                defaultValue={state.filters.zoneId}
                                label="Lugar"
                              >
                                <MenuItem value="">
                                  Selecciona un lugar
                                </MenuItem>
                                {state.zones.map((zone) => (
                                  <MenuItem key={zone.id} value={zone.id}>
                                    {zone.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <Stack
                              direction={{ xs: "column-reverse", sm: "row" }}
                              spacing={1.25}
                            >
                              <ActionSubmitButton
                                variant="outlined"
                                fullWidth
                                formAction="/public/logout"
                                formMethod="post"
                                loadingMessage="Estamos regresando al paso anterior."
                              >
                                Anterior: cambiar persona
                              </ActionSubmitButton>
                              <ActionSubmitButton
                                variant="contained"
                                size="large"
                                fullWidth
                                loadingMessage="Estamos cargando los turnos disponibles."
                              >
                                Siguiente: ver turnos
                              </ActionSubmitButton>
                            </Stack>
                          </Stack>
                        </form>
                      </Stack>
                    </CardContent>
                  </Card>
                ) : state.scheduleView === "available" ? (
                  <form action={submitShiftRequestsAction}>
                    <Stack spacing={3}>
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <CardContent>
                          <Stack spacing={3}>
                            <Stack
                              direction="row"
                              spacing={1.5}
                              sx={{ alignItems: "center" }}
                            >
                              <EventAvailableRoundedIcon color="primary" />
                              <Typography variant="h5">
                                Revisa y envía tu solicitud
                              </Typography>
                            </Stack>
                            <Chip
                              label={selectedZone.name}
                              color="primary"
                              variant="outlined"
                              sx={{ alignSelf: "flex-start" }}
                            />

                            <input
                              type="hidden"
                              name="returnTo"
                              value={requestReturnTo}
                            />

                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1.25}
                            >
                              <Link href="/solicitar">
                                <Button variant="outlined" fullWidth>
                                  Anterior: cambiar lugar
                                </Button>
                              </Link>
                            </Stack>

                            {hasAvailableShifts ? (
                              <>
                                <Box
                                  sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                      xs: "1fr",
                                      md: "minmax(0, 1fr)",
                                    },
                                    gap: 2,
                                  }}
                                >
                                  <TextField
                                    name="comments"
                                    label="Comentario general"
                                    placeholder="Observación opcional para estas solicitudes"
                                    fullWidth
                                  />
                                </Box>

                                <Divider />

                                <Stack spacing={1.25}>
                                  {zoneAvailableShifts.map((shift) => {
                                    const disabled =
                                      shift.status !== "OPEN" ||
                                      shift.ownLatestRequest?.status ===
                                        "PENDING" ||
                                      shift.ownLatestRequest?.status ===
                                        "CONFIRMED";

                                    return (
                                      <Card
                                        key={shift.id}
                                        elevation={0}
                                        sx={{
                                          borderRadius: 3,
                                          border: "1px solid",
                                          borderColor: "divider",
                                          backgroundColor: "#ffffff",
                                        }}
                                      >
                                        <CardContent
                                          sx={{
                                            px: 1.5,
                                            py: 1.35,
                                            "&:last-child": { pb: 1.35 },
                                          }}
                                        >
                                          <Stack spacing={1}>
                                            <Stack
                                              direction="row"
                                              spacing={1.25}
                                              sx={{
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                              }}
                                            >
                                              <Box
                                                sx={{ flex: 1, minWidth: 0 }}
                                              >
                                                <Typography
                                                  variant="subtitle1"
                                                  sx={{ fontWeight: 700 }}
                                                >
                                                  {shift.dateLabel}
                                                </Typography>
                                                <Typography
                                                  variant="body2"
                                                  color="text.secondary"
                                                >
                                                  {shift.zoneName} ·{" "}
                                                  {shift.startLabel} -{" "}
                                                  {shift.endLabel}
                                                </Typography>
                                              </Box>
                                              <Stack
                                                spacing={0.5}
                                                sx={{
                                                  alignItems: "flex-end",
                                                  flexShrink: 0,
                                                }}
                                              >
                                                <Chip
                                                  label={
                                                    shift.status === "OPEN"
                                                      ? "Abierto"
                                                      : "Completo"
                                                  }
                                                  color={
                                                    shift.status === "OPEN"
                                                      ? "success"
                                                      : "default"
                                                  }
                                                  size="small"
                                                />
                                              </Stack>
                                            </Stack>

                                            {shift.ownLatestRequest ? (
                                              <Alert
                                                severity={
                                                  shift.ownLatestRequest
                                                    .status === "PENDING"
                                                    ? "info"
                                                    : "success"
                                                }
                                              >
                                                Ya tienes una solicitud{" "}
                                                {shift.ownLatestRequest.status.toLowerCase()}{" "}
                                                para este turno.
                                              </Alert>
                                            ) : null}

                                            {shift.publicAssignments.length >
                                            0 ? (
                                              <Typography
                                                variant="caption"
                                                color="text.secondary"
                                              >
                                                Ya tomado por{" "}
                                                {shift.publicAssignments
                                                  .map((item) => item.label)
                                                  .join(", ")}
                                              </Typography>
                                            ) : null}

                                            <Box
                                              sx={{
                                                display: "grid",
                                                gridTemplateColumns: {
                                                  xs: "1fr",
                                                  md: "minmax(0, 1fr) auto",
                                                },
                                                gap: 1,
                                                px: 1.25,
                                                py: 1,
                                                border: "1px solid",
                                                borderColor:
                                                  "var(--app-form-border)",
                                                borderRadius: "4px",
                                                backgroundColor:
                                                  "var(--app-form-fill)",
                                                boxShadow:
                                                  "inset 0 1px 0 rgba(255, 255, 255, 0.95)",
                                              }}
                                            >
                                              <Stack spacing={1}>
                                                <Box
                                                  sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent:
                                                      "space-between",
                                                    gap: 1,
                                                    minHeight: 32,
                                                  }}
                                                >
                                                  <Typography
                                                    variant="caption"
                                                    sx={{
                                                      color:
                                                        "var(--app-form-label)",
                                                      fontWeight: 600,
                                                    }}
                                                  >
                                                    {disabled
                                                      ? "No disponible para nueva solicitud"
                                                      : "Incluir en esta solicitud"}
                                                  </Typography>
                                                  <Checkbox
                                                    name="shiftIds"
                                                    value={shift.id}
                                                    disabled={
                                                      disabled ||
                                                      state.config
                                                        .maintenanceModeEnabled
                                                    }
                                                    sx={{
                                                      flexShrink: 0,
                                                      ml: 0.5,
                                                      p: 0.5,
                                                    }}
                                                  />
                                                </Box>

                                                {state.partnerOptions.length >
                                                0 ? (
                                                  <TextField
                                                    select
                                                    name={`suggestedPartnerByShift:${shift.id}`}
                                                    label="Compañero o compañera opcional"
                                                    defaultValue=""
                                                    disabled={
                                                      disabled ||
                                                      state.config
                                                        .maintenanceModeEnabled
                                                    }
                                                    helperText="Se aplicará solo si incluyes este turno en la solicitud."
                                                    fullWidth
                                                    size="small"
                                                  >
                                                    <MenuItem value="">
                                                      Sin sugerencia
                                                    </MenuItem>
                                                    {state.partnerOptions.map(
                                                      (partner) => (
                                                        <MenuItem
                                                          key={`${shift.id}-${partner.id}`}
                                                          value={partner.id}
                                                        >
                                                          {partner.label}
                                                        </MenuItem>
                                                      ),
                                                    )}
                                                  </TextField>
                                                ) : null}
                                              </Stack>
                                            </Box>
                                          </Stack>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </Stack>
                              </>
                            ) : (
                              <Alert severity="warning">
                                No hay turnos disponibles para este lugar en el
                                rango activo. Cambia de lugar para seguir.
                              </Alert>
                            )}

                            {hasAvailableShifts ? (
                              <ActionSubmitButton
                                variant="contained"
                                size="large"
                                disabled={state.config.maintenanceModeEnabled}
                                loadingMessage="Estamos enviando tu solicitud de turnos."
                              >
                                Enviar solicitud
                              </ActionSubmitButton>
                            ) : null}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>
                  </form>
                ) : null}
              </Stack>
            )}
          </Stack>
        </Container>
      </Box>
    </PublicSiteShell>
  );
}
