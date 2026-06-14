import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
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
import { getAsignacionesPageState } from "@/features/public/queries";

function getRequestStatusCopy(status: string) {
  switch (status) {
    case "PENDING":
      return {
        label: "En revisión",
        color: "warning" as const,
      };
    case "CONFIRMED":
      return {
        label: "Confirmada",
        color: "success" as const,
      };
    case "REJECTED":
      return {
        label: "No fue posible asignarla",
        color: "default" as const,
      };
    case "CANCELLED":
      return {
        label: "Cancelada por ti",
        color: "default" as const,
      };
    default:
      return {
        label: "Actualización pendiente",
        color: "default" as const,
      };
  }
}

export default async function AsignacionesPage() {
  const state = await getAsignacionesPageState();

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
              <Typography variant="h3">Seguimiento y asignaciones</Typography>
              <Typography variant="body1" color="text.secondary">
                Revisa tus confirmaciones, tus solicitudes recientes y entra al
                calendario general de turnos confirmados desde un solo lugar.
              </Typography>
            </Box>

            {!state.currentPerson ? (
              <Alert severity="info">
                Si quieres ver tus solicitudes y asignaciones personales,
                primero valida tu PIN en{" "}
                <Link href="/solicitar">/solicitar</Link>.
              </Alert>
            ) : null}

            <Stack spacing={3}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 5,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <CardContent>
                  <Stack spacing={2.5}>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{ alignItems: "center" }}
                    >
                      <ManageSearchRoundedIcon color="primary" />
                      <Typography variant="h5">Mis asignaciones</Typography>
                    </Stack>
                    {state.currentPerson ? (
                      state.ownAssignments.length > 0 ? (
                        <Stack spacing={2}>
                          {state.ownAssignments.map((assignment) => (
                            <Card
                              key={assignment.id}
                              elevation={0}
                              sx={{
                                borderRadius: 4,
                                border: "1px solid",
                                borderColor: "divider",
                                backgroundColor: "background.default",
                              }}
                            >
                              <CardContent>
                                <Stack spacing={1}>
                                  <Typography variant="h6">
                                    {assignment.zoneName}
                                  </Typography>
                                  <Typography color="text.secondary">
                                    {assignment.dateLabel} ·{" "}
                                    {assignment.timeLabel}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Pareja confirmada: {assignment.pairLabel}
                                  </Typography>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      ) : (
                        <Alert severity="info">
                          No tienes asignaciones confirmadas dentro de la
                          ventana visible.
                        </Alert>
                      )
                    ) : (
                      <Alert severity="info">
                        Inicia tu sesión pública para ver tus asignaciones.
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
                }}
              >
                <CardContent>
                  <Stack spacing={2.5}>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{ alignItems: "center" }}
                    >
                      <AssignmentRoundedIcon color="primary" />
                      <Typography variant="h5">
                        Mis solicitudes recientes
                      </Typography>
                    </Stack>
                    {state.currentPerson ? (
                      state.ownRequests.length > 0 ? (
                        <Stack spacing={2}>
                          {state.ownRequests.map((request) => {
                            const statusCopy = getRequestStatusCopy(
                              request.status,
                            );

                            return (
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
                                  <Stack spacing={1}>
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      sx={{ alignItems: "center" }}
                                    >
                                      <Typography variant="h6">
                                        {request.zoneName}
                                      </Typography>
                                      <Chip
                                        label={statusCopy.label}
                                        color={statusCopy.color}
                                        size="small"
                                      />
                                    </Stack>
                                    <Typography color="text.secondary">
                                      {request.dateLabel} · {request.timeLabel}
                                    </Typography>
                                    {request.suggestedPartner ? (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        Pareja sugerida:{" "}
                                        {request.suggestedPartner}
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
                                  </Stack>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </Stack>
                      ) : (
                        <Alert severity="info">
                          No tienes solicitudes recientes registradas.
                        </Alert>
                      )
                    ) : (
                      <Alert severity="info">
                        Inicia tu sesión pública para ver tus solicitudes.
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
                }}
              >
                <CardContent>
                  <Stack spacing={2.5}>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{ alignItems: "center" }}
                    >
                      <CalendarMonthRoundedIcon color="primary" />
                      <Typography variant="h5">Calendario general</Typography>
                    </Stack>
                    <Typography color="text.secondary">
                      Abre una vista simple de calendario con todos los turnos
                      confirmados, nombres, lugares y horarios.
                    </Typography>
                    <Link href="/asignaciones/calendario">
                      <Button variant="contained" size="large">
                        Ver calendario de turnos
                      </Button>
                    </Link>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </PublicSiteShell>
  );
}
