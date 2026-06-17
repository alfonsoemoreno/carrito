import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { PublicSiteShell } from "@/components/public/public-site-shell";
import { getAsignacionesCalendarPageState } from "@/features/public/queries";
import {
  addDaysUtc,
  formatDate,
  getWeekRangeUtc,
  parseDateInput,
  readFirstSearchParam,
  toDateOnlyString,
} from "@/features/public/utils";

const PLACE_PALETTE = [
  { bg: "#fdf1df", border: "#d99a39", text: "#7a4a08" },
  { bg: "#e7f4ef", border: "#2e8b57", text: "#0f5132" },
  { bg: "#e9f0fb", border: "#3c6cc5", text: "#1a3d7c" },
  { bg: "#f8e8ef", border: "#c25b84", text: "#7e2347" },
  { bg: "#efe9fb", border: "#7a5cc7", text: "#4b3486" },
  { bg: "#e8f6f8", border: "#2f8f9d", text: "#14505b" },
  { bg: "#fff1e8", border: "#d26a2e", text: "#7a350e" },
  { bg: "#edf5df", border: "#7a9b2f", text: "#4b620d" },
] as const;

function formatWeekdayLabel(value: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    timeZone: "UTC",
  }).format(value);
}

function formatDayNumber(value: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    timeZone: "UTC",
  }).format(value);
}

function buildCalendarDays(from: Date, to: Date) {
  const { start } = getWeekRangeUtc(from);
  const { end } = getWeekRangeUtc(to);
  const days: Date[] = [];

  for (
    let cursor = start;
    cursor.getTime() <= end.getTime();
    cursor = addDaysUtc(cursor, 1)
  ) {
    days.push(cursor);
  }

  return days;
}

function buildDayHref(dayKey: string) {
  return `/asignaciones/calendario?day=${dayKey}`;
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AsignacionesCalendarioPage({
  searchParams,
}: Props) {
  const state = await getAsignacionesCalendarPageState();
  const rawSearchParams = await searchParams;
  const assignmentsByDate = new Map<string, typeof state.assignments>();

  for (const assignment of state.assignments) {
    const current = assignmentsByDate.get(assignment.dateKey) ?? [];
    current.push(assignment);
    assignmentsByDate.set(assignment.dateKey, current);
  }

  const calendarDays = buildCalendarDays(state.range.from, state.range.to);
  const requestedDay = readFirstSearchParam(rawSearchParams.day);
  const isRequestedDayValid = !!parseDateInput(requestedDay);
  const fallbackDayKey = toDateOnlyString(state.range.from);
  const selectedDayKey =
    isRequestedDayValid &&
    calendarDays.some((day) => toDateOnlyString(day) === requestedDay)
      ? requestedDay
      : fallbackDayKey;
  const selectedDayIndex = calendarDays.findIndex(
    (day) => toDateOnlyString(day) === selectedDayKey,
  );
  const selectedDay =
    selectedDayIndex >= 0 ? calendarDays[selectedDayIndex] : state.range.from;
  const selectedAssignments = assignmentsByDate.get(selectedDayKey) ?? [];
  const previousDayKey =
    selectedDayIndex > 0
      ? toDateOnlyString(calendarDays[selectedDayIndex - 1])
      : null;
  const nextDayKey =
    selectedDayIndex >= 0 && selectedDayIndex < calendarDays.length - 1
      ? toDateOnlyString(calendarDays[selectedDayIndex + 1])
      : null;
  const placeNames = [
    ...new Set(state.assignments.map((item) => item.zoneName)),
  ];
  const placeStyles = new Map(
    placeNames.map((name, index) => [
      name,
      PLACE_PALETTE[index % PLACE_PALETTE.length],
    ]),
  );

  return (
    <PublicSiteShell>
      <Box component="main" sx={{ py: { xs: 4, md: 5 } }}>
        <Container maxWidth="lg">
          <Stack spacing={3}>
            <Stack spacing={2}>
              <Link href="/asignaciones">
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackRoundedIcon />}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Volver a seguimiento
                </Button>
              </Link>
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
                <Typography variant="h3">
                  Calendario de turnos confirmados
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Todos los turnos confirmados visibles en un calendario simple,
                  con nombres, lugares y horarios.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rango visible: {state.range.fromLabel} a {state.range.toLabel}
                </Typography>
              </Box>
            </Stack>

            {!state.currentPerson ? (
              <Alert severity="info">
                Para ver los nombres y el calendario general, primero selecciona
                tu nombre en <Link href="/solicitar">/solicitar</Link>.
              </Alert>
            ) : state.assignments.length === 0 ? (
              <Alert severity="info">
                Todavia no hay turnos confirmados dentro de la ventana visible.
              </Alert>
            ) : (
              <Stack spacing={3}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 5,
                    border: "1px solid",
                    borderColor: "divider",
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--app-surface) 92%, var(--app-accent) 8%), var(--app-surface-muted))",
                  }}
                >
                  <CardContent>
                    <Stack spacing={2.5}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        sx={{
                          alignItems: { xs: "flex-start", sm: "center" },
                          justifyContent: "space-between",
                        }}
                      >
                        <Box>
                          <Typography variant="overline" color="text.secondary">
                            Dia en foco
                          </Typography>
                          <Typography variant="h4">
                            {formatDate(selectedDay)}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          {previousDayKey ? (
                            <Link href={buildDayHref(previousDayKey) as never}>
                              <Button
                                variant="outlined"
                                startIcon={<ChevronLeftRoundedIcon />}
                              >
                                Dia anterior
                              </Button>
                            </Link>
                          ) : null}
                          {nextDayKey ? (
                            <Link href={buildDayHref(nextDayKey) as never}>
                              <Button
                                variant="outlined"
                                endIcon={<ChevronRightRoundedIcon />}
                              >
                                Dia siguiente
                              </Button>
                            </Link>
                          ) : null}
                        </Stack>
                      </Stack>

                      {selectedAssignments.length > 0 ? (
                        <Stack spacing={1.25}>
                          {selectedAssignments.map((assignment) => {
                            const style = placeStyles.get(assignment.zoneName)!;

                            return (
                              <Box
                                key={assignment.id}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 3,
                                  backgroundColor: style.bg,
                                  border: `1px solid ${style.border}`,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 0.75,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ color: style.text, fontWeight: 800 }}
                                >
                                  {assignment.timeLabel}
                                </Typography>
                                <Typography
                                  variant="body1"
                                  sx={{ color: style.text, fontWeight: 800 }}
                                >
                                  {assignment.zoneName}
                                </Typography>
                                <Typography variant="body2">
                                  {assignment.participantNames.join(" + ")}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Stack>
                      ) : (
                        <Alert severity="info">
                          No hay turnos confirmados para este día. Puedes seguir
                          navegando por los demás días del calendario.
                        </Alert>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 5,
                    border: "1px solid",
                    borderColor: "divider",
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--app-surface) 94%, var(--app-accent) 6%), var(--app-surface-muted))",
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack
                        direction="row"
                        spacing={1.25}
                        sx={{ alignItems: "center", flexWrap: "wrap" }}
                      >
                        <CalendarMonthRoundedIcon color="primary" />
                        <Typography variant="h5">Lugares</Typography>
                      </Stack>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        {placeNames.map((name) => {
                          const style = placeStyles.get(name)!;

                          return (
                            <Chip
                              key={name}
                              label={name}
                              sx={{
                                bgcolor: style.bg,
                                color: style.text,
                                border: `1px solid ${style.border}`,
                                fontWeight: 700,
                              }}
                            />
                          );
                        })}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                      lg: "repeat(7, minmax(0, 1fr))",
                    },
                    gap: 2,
                  }}
                >
                  {calendarDays.map((day) => {
                    const dayKey = toDateOnlyString(day);
                    const dayAssignments = assignmentsByDate.get(dayKey) ?? [];
                    const isWithinVisibleRange =
                      day.getTime() >= state.range.from.getTime() &&
                      day.getTime() <= state.range.to.getTime();

                    return (
                      <Card
                        key={dayKey}
                        elevation={0}
                        sx={{
                          minHeight: 220,
                          borderRadius: 5,
                          border: "1px solid",
                          borderColor:
                            dayKey === selectedDayKey
                              ? "primary.main"
                              : isWithinVisibleRange
                                ? "divider"
                                : "var(--app-border)",
                          backgroundColor: isWithinVisibleRange
                            ? "var(--app-surface)"
                            : "var(--app-surface-muted)",
                          opacity: isWithinVisibleRange ? 1 : 0.72,
                          boxShadow:
                            dayKey === selectedDayKey
                              ? "0 0 0 2px rgba(134, 169, 235, 0.2)"
                              : "none",
                        }}
                      >
                        <CardContent>
                          <Stack spacing={1.5}>
                            <Link href={buildDayHref(dayKey) as never}>
                              <Box
                                sx={{
                                  color: "inherit",
                                  textDecoration: "none",
                                  display: "block",
                                }}
                              >
                                <Box>
                                  <Typography
                                    variant="overline"
                                    sx={{
                                      color: "text.secondary",
                                      letterSpacing: 1.1,
                                    }}
                                  >
                                    {formatWeekdayLabel(day)}
                                  </Typography>
                                  <Typography variant="h5">
                                    {formatDayNumber(day)}
                                  </Typography>
                                </Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: "block",
                                    mt: 0.5,
                                    color:
                                      dayKey === selectedDayKey
                                        ? "primary.main"
                                        : "text.secondary",
                                    fontWeight:
                                      dayKey === selectedDayKey ? 800 : 600,
                                  }}
                                >
                                  {dayKey === selectedDayKey
                                    ? "Dia activo"
                                    : "Ver este dia"}
                                </Typography>
                              </Box>
                            </Link>

                            {dayAssignments.length > 0 ? (
                              <Stack spacing={1.25}>
                                {dayAssignments.map((assignment) => {
                                  const style = placeStyles.get(
                                    assignment.zoneName,
                                  )!;

                                  return (
                                    <Box
                                      key={assignment.id}
                                      sx={{
                                        p: 1.25,
                                        borderRadius: 3,
                                        backgroundColor: style.bg,
                                        border: `1px solid ${style.border}`,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 0.75,
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: style.text,
                                          fontWeight: 800,
                                        }}
                                      >
                                        {assignment.timeLabel}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          color: style.text,
                                          fontWeight: 700,
                                        }}
                                      >
                                        {assignment.zoneName}
                                      </Typography>
                                      <Typography variant="body2">
                                        {assignment.participantNames.join(
                                          " + ",
                                        )}
                                      </Typography>
                                    </Box>
                                  );
                                })}
                              </Stack>
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Sin turnos confirmados.
                              </Typography>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Stack>
            )}
          </Stack>
        </Container>
      </Box>
    </PublicSiteShell>
  );
}
