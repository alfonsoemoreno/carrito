import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { getAsignacionesPageState } from "@/features/public/queries";
import { PublicSiteShell } from "@/components/public/public-site-shell";

export default async function AsignacionesPage() {
  const state = await getAsignacionesPageState();

  return (
    <PublicSiteShell>
      <Box component="main" sx={{ py: { xs: 4, md: 7 } }}>
        <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, borderLeft: "4px solid", borderColor: "primary.main", pl: 2 }}>
            <Typography variant="h3">Asignaciones</Typography>
            <Typography variant="body1" color="text.secondary">
              Consulte las asignaciones visibles y, si ya inició sesión, revise también su historial personal.
            </Typography>
          </Box>

          {!state.currentPerson ? (
            <Alert severity="info">
              Si quieres ver tus solicitudes y asignaciones personales, primero valida tu PIN en{" "}
              <Link href="/solicitar">/solicitar</Link>.
            </Alert>
          ) : (
            <Alert severity="success">
              Sesion activa para {state.currentPerson.firstName} {state.currentPerson.lastName}.
            </Alert>
          )}

          <Card elevation={0} sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <AssignmentRoundedIcon color="primary" />
                  <Typography variant="h5">Asignaciones publicas</Typography>
                </Stack>
                {state.publicAssignments.length > 0 ? (
                  <Stack spacing={2}>
                    {state.publicAssignments.map((assignment) => (
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
                            <Typography variant="h6">{assignment.zoneName}</Typography>
                            <Typography color="text.secondary">
                              {assignment.dateLabel} · {assignment.timeLabel}
                            </Typography>
                            <Chip
                              label={assignment.participants}
                              sx={{ alignSelf: "flex-start" }}
                              color={state.config.showParticipantsPublicly ? "primary" : "default"}
                            />
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="info">Todavia no hay asignaciones publicas visibles.</Alert>
                )}
              </Stack>
            </CardContent>
          </Card>

          {state.currentPerson ? (
            <Stack spacing={3}>
              <Card elevation={0} sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
                <CardContent>
                  <Stack spacing={2.5}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <ManageSearchRoundedIcon color="primary" />
                      <Typography variant="h5">Mis asignaciones</Typography>
                    </Stack>
                    {state.ownAssignments.length > 0 ? (
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
                                <Typography variant="h6">{assignment.zoneName}</Typography>
                                <Typography color="text.secondary">
                                  {assignment.dateLabel} · {assignment.timeLabel}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Pareja confirmada: {assignment.pairLabel}
                                </Typography>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    ) : (
                      <Alert severity="info">No tienes asignaciones confirmadas dentro de la ventana visible.</Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
                <CardContent>
                  <Stack spacing={2.5}>
                    <Typography variant="h5">Mis solicitudes recientes</Typography>
                    {state.ownRequests.length > 0 ? (
                      <Stack spacing={2}>
                        {state.ownRequests.map((request) => (
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
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                  <Typography variant="h6">{request.zoneName}</Typography>
                                  <Chip label={request.status} size="small" />
                                </Stack>
                                <Typography color="text.secondary">
                                  {request.dateLabel} · {request.timeLabel}
                                </Typography>
                                {request.suggestedPartner ? (
                                  <Typography variant="body2" color="text.secondary">
                                    Pareja sugerida: {request.suggestedPartner}
                                  </Typography>
                                ) : null}
                                {request.comments ? (
                                  <Typography variant="body2" color="text.secondary">
                                    Nota: {request.comments}
                                  </Typography>
                                ) : null}
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    ) : (
                      <Alert severity="info">No tienes solicitudes recientes registradas.</Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          ) : null}
        </Stack>
        </Container>
      </Box>
    </PublicSiteShell>
  );
}
