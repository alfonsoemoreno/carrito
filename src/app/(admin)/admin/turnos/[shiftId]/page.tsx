import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { EmptyState, FormCard } from "@/components/admin/master-data-cards";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";
import {
  confirmShiftAssignmentAction,
  rejectShiftRequestAction,
} from "@/features/admin/assignment/actions";
import { getShiftAssignmentPageState } from "@/features/admin/assignment/queries";

type Props = {
  params: Promise<{ shiftId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminShiftAssignmentPage({ params, searchParams }: Props) {
  await requireCurrentAdminPageAccess();
  const { shiftId } = await params;
  const state = await getShiftAssignmentPageState(shiftId, searchParams);

  if (!state) {
    return (
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <EmptyState title="Turno no encontrado" body="El turno solicitado no existe o fue eliminado." />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <AdminPageShell
          eyebrow="Operación"
          title="Asignación por turno"
          description="Revisa pendientes, rechaza solicitudes y confirma la pareja definitiva del turno."
        >
          {state.notice ? <Alert severity="success">{state.notice}</Alert> : null}
          {state.error ? <Alert severity="error">{state.error}</Alert> : null}

          <Card sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.5}
                  sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}
                >
                  <Box>
                    <Typography variant="h4">{state.shift.zoneName}</Typography>
                    <Typography color="text.secondary">
                      {state.shift.dateLabel} · {state.shift.timeLabel}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    <Chip label={state.shift.status} color={state.shift.status === "FULL" ? "success" : "default"} />
                    <Link href="/admin/solicitudes">
                      <Button variant="outlined">Volver a bandeja</Button>
                    </Link>
                  </Stack>
                </Stack>

                {state.shift.blocks.length > 0 ? (
                  <Alert severity="warning" icon={<WarningAmberRoundedIcon />}>
                    Este turno tiene bloqueos relacionados: {state.shift.blocks.join(", ")}
                  </Alert>
                ) : null}
              </Stack>
            </CardContent>
          </Card>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "1.1fr 0.9fr" },
              gap: 2.5,
            }}
          >
            <FormCard title="Solicitudes pendientes" description="Cada rechazo pide motivo para mantener trazabilidad.">
              {state.pendingRequests.length === 0 ? (
                <EmptyState title="Sin pendientes" body="Este turno ya no tiene solicitudes pendientes." />
              ) : (
                <Stack spacing={2}>
                  {state.pendingRequests.map((request) => (
                    <Card
                      key={request.id}
                      elevation={0}
                      sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", backgroundColor: "background.default" }}
                    >
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                            <Typography variant="h6">{request.personLabel}</Typography>
                            <Chip label={request.gender} size="small" />
                          </Stack>
                          {request.suggestedPartnerLabel ? (
                            <Typography variant="body2" color="text.secondary">
                              Pareja sugerida: {request.suggestedPartnerLabel}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Sin pareja sugerida.
                            </Typography>
                          )}
                          {request.comments ? (
                            <Typography variant="body2" color="text.secondary">
                              Nota: {request.comments}
                            </Typography>
                          ) : null}

                          <form action={rejectShiftRequestAction}>
                            <Stack spacing={1.5}>
                              <input type="hidden" name="requestId" value={request.id} />
                              <input type="hidden" name="shiftId" value={state.shift.id} />
                              <TextField
                                name="reason"
                                label="Motivo de rechazo"
                                placeholder="Ej. supera limite semanal o pareja no valida"
                                fullWidth
                              />
                              <Button type="submit" variant="outlined" color="error">
                                Rechazar solicitud
                              </Button>
                            </Stack>
                          </form>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </FormCard>

            <Stack spacing={2.5}>
              <FormCard
                title="Confirmar o reemplazar asignacion"
                description="Si hay advertencias de reglas, debes ingresar motivo de excepcion administrativa."
              >
                <form action={confirmShiftAssignmentAction}>
                  <Stack spacing={2}>
                    <input type="hidden" name="shiftId" value={state.shift.id} />
                    <TextField
                      select
                      name="person1Id"
                      label="Persona 1"
                      defaultValue={state.defaults.person1Id}
                      fullWidth
                    >
                      {state.activePeople.map((person) => (
                        <MenuItem key={person.id} value={person.id}>
                          {person.label}{person.requested ? " · con solicitud" : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      name="person2Id"
                      label="Persona 2"
                      defaultValue={state.defaults.person2Id}
                      fullWidth
                    >
                      {state.activePeople.map((person) => (
                        <MenuItem key={person.id} value={person.id}>
                          {person.label}{person.requested ? " · con solicitud" : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      name="exceptionReason"
                      label="Motivo de excepcion o reemplazo"
                      placeholder="Obligatorio si se incumple una regla o si decides reemplazar manualmente"
                      multiline
                      minRows={3}
                      fullWidth
                    />
                    <Button type="submit" variant="contained">
                      Confirmar pareja para este turno
                    </Button>
                  </Stack>
                </form>
              </FormCard>

              <FormCard title="Historial del turno" description="Lo ya resuelto queda visible para contexto operativo.">
                <Stack spacing={1.5}>
                  {state.assignments.length > 0 ? (
                    state.assignments.map((assignment) => (
                      <Box
                        key={assignment.id}
                        sx={{
                          borderRadius: 4,
                          border: "1px solid",
                          borderColor: "divider",
                          p: 2,
                        }}
                      >
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                            <Typography variant="h6">{assignment.pairLabel}</Typography>
                            <Chip label={assignment.status} size="small" />
                            {assignment.ruleExceptionUsed ? <Chip label="Con excepcion" size="small" color="warning" /> : null}
                          </Stack>
                          {assignment.exceptionReason ? (
                            <Typography variant="body2" color="text.secondary">
                              Motivo: {assignment.exceptionReason}
                            </Typography>
                          ) : null}
                        </Stack>
                      </Box>
                    ))
                  ) : (
                    <Typography color="text.secondary">
                      Todavia no hay asignaciones registradas para este turno.
                    </Typography>
                  )}

                  {state.resolvedRequests.length > 0 ? (
                    <Box sx={{ pt: 1 }}>
                      <Typography variant="subtitle1">Solicitudes ya resueltas</Typography>
                      <Stack spacing={1} sx={{ pt: 1 }}>
                        {state.resolvedRequests.map((request) => (
                          <Box key={request.id}>
                            <Typography variant="body2">
                              {request.personLabel} · {request.status}
                            </Typography>
                            {request.comments ? (
                              <Typography variant="caption" color="text.secondary">
                                {request.comments}
                              </Typography>
                            ) : null}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  ) : null}
                </Stack>
              </FormCard>
            </Stack>
          </Box>
        </AdminPageShell>
      </Container>
    </Box>
  );
}
