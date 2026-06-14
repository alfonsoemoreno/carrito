import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
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
import { PublicSiteShell } from "@/components/public/public-site-shell";
import {
  cancelOwnPendingRequestAction,
  submitShiftRequestsAction,
} from "@/features/public/actions";
import { getSolicitarPageState } from "@/features/public/queries";
import {
  addDaysUtc,
  parseDateInput,
  startOfTodayUtc,
  toDateOnlyString,
} from "@/features/public/utils";

type ScheduleView = "available" | "confirmed" | "calendar";

type CalendarConfirmedEntry = {
  id: string;
  zoneName: string;
  timeRange: string;
  label: string;
};

type CalendarDayCell = {
  key: string;
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  availableCount: number;
  confirmedCount: number;
  pendingCount: number;
  confirmedEntries: CalendarConfirmedEntry[];
};

type CalendarMonth = {
  key: string;
  label: string;
  days: Array<CalendarDayCell | null>;
};

const CALENDAR_WEEKDAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

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

function getMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function getMonthStartUtc(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

function getMonthEndUtc(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0));
}

function getCalendarAssignmentPreview(label: string) {
  return label.replace(/\s\+\s/g, " / ");
}

function getZoneAccent(zoneName: string) {
  const hash = zoneName
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);
  const hue = hash % 360;

  return {
    backgroundColor: `hsla(${hue}, 72%, 92%, 0.96)`,
    borderColor: `hsla(${hue}, 58%, 48%, 0.34)`,
    accentColor: `hsl(${hue}, 62%, 34%)`,
    zoneBadgeColor: `hsla(${hue}, 64%, 30%, 0.12)`,
  };
}

function buildCalendarMonths(input: {
  from: string;
  to: string;
  shiftBoard: Array<{
    id: string;
    shiftDate: Date;
    status: string;
    zoneName: string;
    startLabel: string;
    endLabel: string;
    confirmedCount: number;
    ownLatestRequest: { status: string } | null;
    publicAssignments: Array<{
      id: string;
      label: string;
    }>;
  }>;
  ownPendingRequests: Array<{
    shift: {
      shiftDate: Date;
    };
  }>;
  selectedDate: string;
}) {
  const rangeStart = parseDateInput(input.from);
  const rangeEnd = parseDateInput(input.to);

  if (!rangeStart || !rangeEnd) {
    return [] as CalendarMonth[];
  }

  const availableByDay = new Map<string, number>();
  const confirmedByDay = new Map<string, number>();
  const pendingByDay = new Map<string, number>();
  const confirmedEntriesByDay = new Map<string, CalendarConfirmedEntry[]>();
  const selectedDateKey = input.selectedDate;

  input.shiftBoard.forEach((shift) => {
    const key = toDateOnlyString(shift.shiftDate);
    const requestStatus = shift.ownLatestRequest?.status;

    if (
      shift.status === "OPEN" &&
      requestStatus !== "PENDING" &&
      requestStatus !== "CONFIRMED"
    ) {
      availableByDay.set(key, (availableByDay.get(key) ?? 0) + 1);
    }

    if (shift.confirmedCount > 0) {
      confirmedByDay.set(
        key,
        (confirmedByDay.get(key) ?? 0) + shift.confirmedCount,
      );

      const dayEntries = confirmedEntriesByDay.get(key) ?? [];
      shift.publicAssignments.forEach((assignment) => {
        dayEntries.push({
          id: assignment.id,
          zoneName: shift.zoneName,
          timeRange: `${shift.startLabel} - ${shift.endLabel}`,
          label: assignment.label,
        });
      });
      confirmedEntriesByDay.set(key, dayEntries);
    }
  });

  input.ownPendingRequests.forEach((request) => {
    const key = toDateOnlyString(request.shift.shiftDate);
    pendingByDay.set(key, (pendingByDay.get(key) ?? 0) + 1);
  });

  const todayKey = toDateOnlyString(startOfTodayUtc());
  const months: CalendarMonth[] = [];
  let cursor = getMonthStartUtc(rangeStart);
  const endMonth = getMonthStartUtc(rangeEnd);

  while (cursor.getTime() <= endMonth.getTime()) {
    const monthStart = getMonthStartUtc(cursor);
    const monthEnd = getMonthEndUtc(cursor);
    const leadingPadding = (monthStart.getUTCDay() + 6) % 7;
    const cells: Array<CalendarDayCell | null> = Array.from(
      { length: leadingPadding },
      () => null,
    );

    for (let day = 1; day <= monthEnd.getUTCDate(); day += 1) {
      const date = new Date(
        Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), day),
      );
      const key = toDateOnlyString(date);

      cells.push({
        key,
        date,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: key === todayKey,
        isSelected: key === selectedDateKey,
        availableCount: availableByDay.get(key) ?? 0,
        confirmedCount: confirmedByDay.get(key) ?? 0,
        pendingCount: pendingByDay.get(key) ?? 0,
        confirmedEntries: confirmedEntriesByDay.get(key) ?? [],
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    months.push({
      key: `${monthStart.getUTCFullYear()}-${monthStart.getUTCMonth()}`,
      label: getMonthLabel(monthStart),
      days: cells,
    });

    cursor = addDaysUtc(monthEnd, 1);
  }

  return months;
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SolicitarPage({ searchParams }: Props) {
  const state = await getSolicitarPageState(searchParams);
  const scheduleMonths = state.currentPerson
    ? buildCalendarMonths({
        from: state.filters.from,
        to: state.filters.to,
        shiftBoard: state.shiftBoard,
        ownPendingRequests: state.ownPendingRequests,
        selectedDate: state.filters.selectedDate,
      })
    : [];
  const ownConfirmedShiftIds = new Set(
    state.ownConfirmedAssignments.map((assignment) => assignment.shiftId),
  );
  const totalAvailable = state.shiftBoard.filter(
    (shift) =>
      shift.status === "OPEN" &&
      shift.ownLatestRequest?.status !== "PENDING" &&
      shift.ownLatestRequest?.status !== "CONFIRMED",
  ).length;
  const nextConfirmed = state.ownConfirmedAssignments[0] ?? null;
  const confirmedShiftBoard = state.shiftBoard.filter(
    (shift) => shift.confirmedCount > 0,
  );
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
  const requestReturnTo = buildScheduleHref(
    { ...state.filters, selectedDate: "" },
    "available",
  );
  const selectedDateShifts = state.filters.selectedDate
    ? state.shiftBoard.filter(
        (shift) =>
          toDateOnlyString(shift.shiftDate) === state.filters.selectedDate,
      )
    : [];

  return (
    <PublicSiteShell>
      <Box component="main" sx={{ py: { xs: 4, md: 7 } }}>
        <Container maxWidth="lg">
          <Stack spacing={4}>
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
                Selecciona tu usuario, valida tu PIN, elige una zona y pide tus
                turnos en pocos pasos.
              </Typography>
            </Box>

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
                        <PersonSearchRoundedIcon color="primary" />
                        <Typography variant="h5">
                          1. Selecciona tu nombre
                        </Typography>
                      </Stack>
                      <PublicPersonPicker
                        people={state.people.map((person) => ({
                          id: person.id,
                          label: `${person.firstName} ${person.lastName}`,
                          locked:
                            !!person.pinLockedUntil &&
                            person.pinLockedUntil > new Date(),
                        }))}
                        selectedPersonId={state.selectedPerson?.id ?? ""}
                      />
                    </Stack>
                  </CardContent>
                </Card>

                {state.selectedPerson ? (
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
                          <LockOpenRoundedIcon color="primary" />
                          <Typography variant="h5">
                            2. Confirme su PIN
                          </Typography>
                        </Stack>
                        <Typography color="text.secondary">
                          Persona seleccionada:{" "}
                          <strong>
                            {state.selectedPerson.firstName}{" "}
                            {state.selectedPerson.lastName}
                          </strong>
                        </Typography>
                        <form action="/public/authenticate" method="post">
                          <Stack spacing={2.25}>
                            <input
                              type="hidden"
                              name="personId"
                              value={state.selectedPerson.id}
                            />
                            <input
                              type="hidden"
                              name="returnTo"
                              value="/solicitar"
                            />
                            <TextField
                              name="pin"
                              label="PIN personal"
                              type="password"
                              slotProps={{
                                htmlInput: {
                                  inputMode: "numeric",
                                  minLength: state.config.pinMinLength,
                                  maxLength: state.config.pinMaxLength,
                                },
                              }}
                              helperText={`Debe tener entre ${state.config.pinMinLength} y ${state.config.pinMaxLength} digitos.`}
                              fullWidth
                            />
                            <Button
                              type="submit"
                              variant="contained"
                              size="large"
                              sx={{ alignSelf: "flex-start", minWidth: 170 }}
                            >
                              Continuar
                            </Button>
                          </Stack>
                        </form>
                      </Stack>
                    </CardContent>
                  </Card>
                ) : null}
              </Stack>
            ) : (
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
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={2}
                      sx={{
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", md: "center" },
                      }}
                    >
                      <Box>
                        <Typography variant="h5">
                          Sesión activa para {state.currentPerson.firstName}{" "}
                          {state.currentPerson.lastName}
                        </Typography>
                        <Typography color="text.secondary">
                          Sigue el flujo guiado para elegir una zona y solicitar
                          solo los turnos que realmente te interesan.
                        </Typography>
                      </Box>
                      <form action="/public/logout" method="post">
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                        >
                          <Link href="/asignaciones">
                            <Button variant="outlined">Ver seguimiento</Button>
                          </Link>
                          <Button
                            type="submit"
                            variant="outlined"
                            startIcon={<LogoutRoundedIcon />}
                          >
                            Cerrar sesion
                          </Button>
                        </Stack>
                      </form>
                    </Stack>
                  </CardContent>
                </Card>

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
                          3. Selecciona la zona
                        </Typography>
                      </Stack>
                      <Typography color="text.secondary">
                        Elige una zona y te mostraremos sus turnos abiertos en
                        orden cronológico.
                      </Typography>
                      <form action="/solicitar">
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr",
                              md: "minmax(0, 1fr) auto",
                            },
                            gap: 2,
                            alignItems: { md: "end" },
                          }}
                        >
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
                            <InputLabel id="zone-filter-label">Zona</InputLabel>
                            <Select
                              labelId="zone-filter-label"
                              name="zoneId"
                              defaultValue={state.filters.zoneId}
                              label="Zona"
                            >
                              <MenuItem value="">Selecciona una zona</MenuItem>
                              {state.zones.map((zone) => (
                                <MenuItem key={zone.id} value={zone.id}>
                                  {zone.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            sx={{ minWidth: 140 }}
                          >
                            Ver turnos
                          </Button>
                        </Box>
                      </form>
                      {selectedZone ? (
                        <Chip
                          label={`Zona seleccionada: ${selectedZone.name}`}
                          color="primary"
                          variant="outlined"
                          sx={{ alignSelf: "flex-start" }}
                        />
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>

                {state.scheduleView === "available" ? (
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
                                4. Selecciona los turnos que quieres pedir
                              </Typography>
                            </Stack>
                            <Typography color="text.secondary">
                              {selectedZone
                                ? `Estos son todos los turnos abiertos para ${selectedZone.name}, ordenados por fecha y hora.`
                                : "Primero elige una zona para ver sus turnos disponibles."}
                            </Typography>
                            {selectedZone ? (
                              <Alert severity="info">
                                5. Marca uno o varios turnos y luego envía la
                                solicitud.
                              </Alert>
                            ) : null}

                            <input
                              type="hidden"
                              name="returnTo"
                              value={requestReturnTo}
                            />
                            <input
                              type="hidden"
                              name="suggestedPartnerId"
                              value=""
                            />

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

                            {!selectedZone ? (
                              <Alert severity="info">
                                Selecciona una zona para desbloquear la lista de
                                turnos.
                              </Alert>
                            ) : zoneAvailableShifts.length > 0 ? (
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
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
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
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "space-between",
                                              gap: 1,
                                              minHeight: 44,
                                              px: 1.25,
                                              py: 0.35,
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
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                color: "var(--app-form-label)",
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
                                        </Stack>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </Stack>
                            ) : (
                              <Alert severity="info">
                                No hay turnos abiertos para la zona seleccionada
                                en el rango activo.
                              </Alert>
                            )}

                            <Button
                              type="submit"
                              variant="contained"
                              size="large"
                              disabled={
                                state.config.maintenanceModeEnabled ||
                                !selectedZone ||
                                zoneAvailableShifts.length === 0
                              }
                            >
                              6. Solicitar turnos seleccionados
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>
                  </form>
                ) : null}

                {state.scheduleView === "confirmed" ? (
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
                          <AssignmentTurnedInRoundedIcon color="primary" />
                          <Typography variant="h5">
                            Turnos confirmados del periodo
                          </Typography>
                        </Stack>
                        {confirmedShiftBoard.length > 0 ? (
                          <Stack spacing={2}>
                            {confirmedShiftBoard.map((shift) => (
                              <Card
                                key={shift.id}
                                elevation={0}
                                sx={{
                                  borderRadius: 4,
                                  border: "1px solid",
                                  borderColor: "divider",
                                  backgroundColor: "background.default",
                                }}
                              >
                                <CardContent>
                                  <Stack spacing={1.25}>
                                    <Stack
                                      direction={{ xs: "column", md: "row" }}
                                      spacing={1.5}
                                      sx={{
                                        justifyContent: "space-between",
                                        alignItems: {
                                          xs: "flex-start",
                                          md: "center",
                                        },
                                      }}
                                    >
                                      <Box>
                                        <Typography variant="h6">
                                          {shift.zoneName}
                                        </Typography>
                                        <Typography color="text.secondary">
                                          {shift.dateLabel} · {shift.startLabel}{" "}
                                          - {shift.endLabel}
                                        </Typography>
                                      </Box>
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        sx={{ flexWrap: "wrap" }}
                                      >
                                        <Chip
                                          label="Confirmado"
                                          color="success"
                                        />
                                        {ownConfirmedShiftIds.has(shift.id) ? (
                                          <Chip
                                            label="Tambien es tuyo"
                                            color="primary"
                                            variant="outlined"
                                          />
                                        ) : null}
                                      </Stack>
                                    </Stack>
                                    {shift.publicAssignments.length > 0 ? (
                                      <Stack spacing={0.75}>
                                        {shift.publicAssignments.map(
                                          (assignment) => (
                                            <Typography
                                              key={assignment.id}
                                              variant="body2"
                                              color="text.secondary"
                                            >
                                              Pareja confirmada:{" "}
                                              {assignment.label}
                                            </Typography>
                                          ),
                                        )}
                                      </Stack>
                                    ) : null}
                                  </Stack>
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>
                        ) : (
                          <Alert severity="info">
                            No hay turnos confirmados dentro del periodo
                            filtrado.
                          </Alert>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                ) : null}

                {state.scheduleView === "calendar" ? (
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
                          <CalendarMonthRoundedIcon color="primary" />
                          <Typography variant="h5">
                            Calendario de actividad
                          </Typography>
                        </Stack>
                        <Typography color="text.secondary">
                          El calendario resume tus dias con turnos abiertos para
                          solicitar, confirmaciones activas y solicitudes
                          pendientes.
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ flexWrap: "wrap" }}
                        >
                          <Chip
                            label="Azul: abiertos"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            label="Verde: confirmados"
                            color="success"
                            variant="outlined"
                          />
                          <Chip
                            label="Amarillo: pendientes"
                            color="warning"
                            variant="outlined"
                          />
                        </Stack>

                        <Box sx={{ overflowX: "auto", pb: 0.5 }}>
                          <Box
                            sx={{
                              minWidth: 760,
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                            }}
                          >
                            {scheduleMonths.map((month) => (
                              <Box key={month.key}>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    mb: 1.5,
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {month.label}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "grid",
                                    gridTemplateColumns:
                                      "repeat(7, minmax(0, 1fr))",
                                    gap: 1,
                                    mb: 1,
                                  }}
                                >
                                  {CALENDAR_WEEKDAYS.map((day) => (
                                    <Typography
                                      key={day}
                                      variant="caption"
                                      sx={{
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                        color: "text.secondary",
                                        fontWeight: 700,
                                        px: 1,
                                      }}
                                    >
                                      {day}
                                    </Typography>
                                  ))}
                                </Box>
                                <Box
                                  sx={{
                                    display: "grid",
                                    gridTemplateColumns:
                                      "repeat(7, minmax(0, 1fr))",
                                    gap: 1,
                                  }}
                                >
                                  {month.days.map((day, index) => {
                                    if (!day) {
                                      return (
                                        <Box
                                          key={`${month.key}-empty-${index}`}
                                          sx={{
                                            minHeight: 118,
                                            borderRadius: 3,
                                            backgroundColor:
                                              "rgba(255,255,255,0.55)",
                                          }}
                                        />
                                      );
                                    }

                                    const hasActivity =
                                      day.availableCount > 0 ||
                                      day.confirmedCount > 0 ||
                                      day.pendingCount > 0;
                                    const visibleConfirmedEntries =
                                      day.confirmedEntries.slice(0, 2);
                                    const remainingConfirmedLabels =
                                      day.confirmedEntries.length -
                                      visibleConfirmedEntries.length;

                                    return (
                                      <Link
                                        key={day.key}
                                        href={buildScheduleHref(
                                          {
                                            ...state.filters,
                                            selectedDate: day.key,
                                          },
                                          "calendar",
                                        )}
                                      >
                                        <Box
                                          sx={{
                                            minHeight: 118,
                                            p: 1.2,
                                            borderRadius: 3,
                                            border: "1px solid",
                                            borderColor: day.isSelected
                                              ? "primary.main"
                                              : day.isToday
                                                ? "primary.light"
                                                : "divider",
                                            background: day.isSelected
                                              ? "linear-gradient(180deg, rgba(91,120,182,0.16), rgba(255,255,255,0.98))"
                                              : hasActivity
                                                ? "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,251,0.95))"
                                                : "#ffffff",
                                            boxShadow: day.isSelected
                                              ? "0 14px 30px rgba(74, 109, 167, 0.16)"
                                              : hasActivity
                                                ? "0 10px 24px rgba(17, 17, 17, 0.05)"
                                                : "none",
                                            transition:
                                              "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
                                            "&:hover": {
                                              transform: "translateY(-2px)",
                                              boxShadow:
                                                "0 12px 24px rgba(17, 17, 17, 0.08)",
                                            },
                                          }}
                                        >
                                          <Stack spacing={1}>
                                            <Stack
                                              direction="row"
                                              sx={{
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                              }}
                                            >
                                              <Typography
                                                variant="subtitle2"
                                                sx={{ fontWeight: 700 }}
                                              >
                                                {day.dayNumber}
                                              </Typography>
                                              {day.isToday ? (
                                                <Chip
                                                  label="Hoy"
                                                  size="small"
                                                  color="primary"
                                                />
                                              ) : null}
                                            </Stack>
                                            {day.availableCount > 0 ? (
                                              <Chip
                                                label={`${day.availableCount} abiertos`}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{ alignSelf: "flex-start" }}
                                              />
                                            ) : null}
                                            {day.confirmedCount > 0 ? (
                                              <Chip
                                                label={`${day.confirmedCount} confirmados`}
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                                sx={{ alignSelf: "flex-start" }}
                                              />
                                            ) : null}
                                            {visibleConfirmedEntries.map(
                                              (entry) => {
                                                const zoneAccent =
                                                  getZoneAccent(entry.zoneName);

                                                return (
                                                  <Box
                                                    key={entry.id}
                                                    sx={{
                                                      display: "block",
                                                      px: 0.9,
                                                      py: 0.65,
                                                      borderRadius: 2,
                                                      border: "1px solid",
                                                      borderColor:
                                                        zoneAccent.borderColor,
                                                      backgroundColor:
                                                        zoneAccent.backgroundColor,
                                                      color:
                                                        zoneAccent.accentColor,
                                                    }}
                                                  >
                                                    <Typography
                                                      variant="caption"
                                                      sx={{
                                                        display: "inline-flex",
                                                        px: 0.7,
                                                        py: 0.15,
                                                        mb: 0.45,
                                                        borderRadius: 999,
                                                        backgroundColor:
                                                          zoneAccent.zoneBadgeColor,
                                                        color:
                                                          zoneAccent.accentColor,
                                                        fontWeight: 800,
                                                        letterSpacing: "0.04em",
                                                        textTransform:
                                                          "uppercase",
                                                      }}
                                                    >
                                                      {entry.zoneName}
                                                    </Typography>
                                                    <Typography
                                                      variant="caption"
                                                      sx={{
                                                        display: "block",
                                                        fontWeight: 700,
                                                        lineHeight: 1.25,
                                                      }}
                                                    >
                                                      {entry.timeRange}
                                                    </Typography>
                                                    <Typography
                                                      variant="caption"
                                                      sx={{
                                                        display: "block",
                                                        lineHeight: 1.25,
                                                        fontWeight: 700,
                                                      }}
                                                    >
                                                      {getCalendarAssignmentPreview(
                                                        entry.label,
                                                      )}
                                                    </Typography>
                                                  </Box>
                                                );
                                              },
                                            )}
                                            {remainingConfirmedLabels > 0 ? (
                                              <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ fontWeight: 700 }}
                                              >
                                                +{remainingConfirmedLabels}{" "}
                                                pareja(s) más
                                              </Typography>
                                            ) : null}
                                            {day.pendingCount > 0 ? (
                                              <Chip
                                                label={`${day.pendingCount} pendientes`}
                                                size="small"
                                                color="warning"
                                                variant="outlined"
                                                sx={{ alignSelf: "flex-start" }}
                                              />
                                            ) : null}
                                            {!hasActivity ? (
                                              <Typography
                                                variant="caption"
                                                color="text.secondary"
                                              >
                                                Sin actividad
                                              </Typography>
                                            ) : null}
                                          </Stack>
                                        </Box>
                                      </Link>
                                    );
                                  })}
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </Box>

                        {state.filters.selectedDate ? (
                          <Card
                            elevation={0}
                            sx={{
                              borderRadius: 4,
                              border: "1px solid",
                              borderColor: "divider",
                              backgroundColor: "background.default",
                            }}
                          >
                            <CardContent>
                              <Stack spacing={2.25}>
                                <Stack
                                  direction={{ xs: "column", md: "row" }}
                                  spacing={1.25}
                                  sx={{
                                    justifyContent: "space-between",
                                    alignItems: {
                                      xs: "flex-start",
                                      md: "center",
                                    },
                                  }}
                                >
                                  <Box>
                                    <Typography variant="h6">
                                      Detalle del día
                                    </Typography>
                                    <Typography color="text.secondary">
                                      {selectedDateShifts[0]?.dateLabel ??
                                        state.filters.selectedDate}
                                    </Typography>
                                  </Box>
                                  <Link
                                    href={buildScheduleHref(
                                      { ...state.filters, selectedDate: "" },
                                      "calendar",
                                    )}
                                  >
                                    <Button variant="outlined">
                                      Quitar selección
                                    </Button>
                                  </Link>
                                </Stack>

                                {selectedDateShifts.length > 0 ? (
                                  <Stack spacing={1.5}>
                                    {selectedDateShifts.map((shift) => (
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
                                        <CardContent>
                                          <Stack spacing={1.25}>
                                            <Stack
                                              direction={{
                                                xs: "column",
                                                md: "row",
                                              }}
                                              spacing={1}
                                              sx={{
                                                justifyContent: "space-between",
                                                alignItems: {
                                                  xs: "flex-start",
                                                  md: "center",
                                                },
                                              }}
                                            >
                                              <Box>
                                                <Typography variant="h6">
                                                  {shift.zoneName}
                                                </Typography>
                                                <Typography color="text.secondary">
                                                  {shift.startLabel} -{" "}
                                                  {shift.endLabel}
                                                </Typography>
                                              </Box>
                                              <Stack
                                                direction="row"
                                                spacing={1}
                                                sx={{ flexWrap: "wrap" }}
                                              >
                                                <Chip
                                                  label={
                                                    shift.status === "OPEN"
                                                      ? "Abierto"
                                                      : "Completo"
                                                  }
                                                  color={
                                                    shift.status === "OPEN"
                                                      ? "primary"
                                                      : "success"
                                                  }
                                                />
                                                {ownConfirmedShiftIds.has(
                                                  shift.id,
                                                ) ? (
                                                  <Chip
                                                    label="Tu confirmación"
                                                    color="primary"
                                                    variant="outlined"
                                                  />
                                                ) : null}
                                                {shift.ownLatestRequest
                                                  ?.status === "PENDING" ? (
                                                  <Chip
                                                    label="Solicitud pendiente"
                                                    color="warning"
                                                    variant="outlined"
                                                  />
                                                ) : null}
                                              </Stack>
                                            </Stack>

                                            {shift.publicAssignments.length >
                                            0 ? (
                                              <Stack spacing={0.75}>
                                                {shift.publicAssignments.map(
                                                  (assignment) => (
                                                    <Typography
                                                      key={assignment.id}
                                                      variant="body2"
                                                      color="text.secondary"
                                                    >
                                                      Confirmado:{" "}
                                                      {assignment.label}
                                                    </Typography>
                                                  ),
                                                )}
                                              </Stack>
                                            ) : (
                                              <Typography
                                                variant="body2"
                                                color="text.secondary"
                                              >
                                                Todavía no hay confirmaciones
                                                registradas para este turno.
                                              </Typography>
                                            )}
                                          </Stack>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </Stack>
                                ) : (
                                  <Alert severity="info">
                                    No hay turnos visibles para el día
                                    seleccionado.
                                  </Alert>
                                )}
                              </Stack>
                            </CardContent>
                          </Card>
                        ) : null}
                      </Stack>
                    </CardContent>
                  </Card>
                ) : null}

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
                      <Typography variant="h5">
                        Mis solicitudes pendientes
                      </Typography>
                      {state.ownPendingRequests.length > 0 ? (
                        <Stack spacing={2}>
                          {state.ownPendingRequests.map((request) => (
                            <Card
                              key={request.id}
                              elevation={0}
                              sx={{
                                borderRadius: 4,
                                border: "1px solid",
                                borderColor: "divider",
                                backgroundColor: "background.default",
                              }}
                            >
                              <CardContent>
                                <Stack
                                  direction={{ xs: "column", md: "row" }}
                                  spacing={2}
                                  sx={{
                                    justifyContent: "space-between",
                                    alignItems: {
                                      xs: "flex-start",
                                      md: "center",
                                    },
                                  }}
                                >
                                  <Box>
                                    <Typography variant="h6">
                                      {request.shift.zone.name}
                                    </Typography>
                                    <Typography color="text.secondary">
                                      {request.shift.shiftDate
                                        .toISOString()
                                        .slice(0, 10)}{" "}
                                      ·{" "}
                                      {request.shift.startTime
                                        .toISOString()
                                        .slice(11, 16)}{" "}
                                      -{" "}
                                      {request.shift.endTime
                                        .toISOString()
                                        .slice(11, 16)}
                                    </Typography>
                                    {request.suggestedPartner ? (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        Pareja sugerida:{" "}
                                        {request.suggestedPartner.firstName}{" "}
                                        {request.suggestedPartner.lastName}
                                      </Typography>
                                    ) : null}
                                    {request.comments ? (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        Nota: {request.comments}
                                      </Typography>
                                    ) : null}
                                  </Box>
                                  <form action={cancelOwnPendingRequestAction}>
                                    <input
                                      type="hidden"
                                      name="requestId"
                                      value={request.id}
                                    />
                                    <Button
                                      type="submit"
                                      variant="outlined"
                                      color="error"
                                    >
                                      Cancelar
                                    </Button>
                                  </form>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      ) : (
                        <Alert severity="info">
                          No tienes solicitudes pendientes. Tambien puedes
                          revisar tus confirmaciones en{" "}
                          <Link href="/asignaciones">/asignaciones</Link>.
                        </Alert>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            )}
          </Stack>
        </Container>
      </Box>
    </PublicSiteShell>
  );
}
