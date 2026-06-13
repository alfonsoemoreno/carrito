import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
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
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import {
  authenticatePublicPersonAction,
  cancelOwnPendingRequestAction,
  logoutPublicPersonAction,
  submitShiftRequestsAction,
} from "@/features/public/actions";
import { getSolicitarPageState } from "@/features/public/queries";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SolicitarPage({ searchParams }: Props) {
  const state = await getSolicitarPageState(searchParams);

  return (
    <Box component="main" sx={{ py: { xs: 4, md: 7 } }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="overline" color="primary.main">
              Fase 5
            </Typography>
            <Typography variant="h3">Solicitud publica de turnos</Typography>
            <Typography variant="body1" color="text.secondary">
              Busca tu nombre, valida tu PIN y registra solicitudes pendientes sobre turnos publicos disponibles.
            </Typography>
          </Box>

          {state.notice ? <Alert severity="success">{state.notice}</Alert> : null}
          {state.authError ? <Alert severity="error">{state.authError}</Alert> : null}
          {state.requestError ? <Alert severity="error">{state.requestError}</Alert> : null}
          {state.config.maintenanceModeEnabled ? (
            <Alert severity="warning">
              El sistema esta en modo mantenimiento. Las consultas publicas siguen visibles, pero no se deberian registrar nuevas solicitudes hasta desactivar ese modo.
            </Alert>
          ) : null}

          {!state.currentPerson ? (
            <Stack spacing={3}>
              <Card elevation={0} sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
                <CardContent>
                  <Stack spacing={2.5}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <PersonSearchRoundedIcon color="primary" />
                      <Typography variant="h5">1. Busca tu nombre</Typography>
                    </Stack>
                    <form action="/solicitar">
                      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                        <TextField
                          name="personQuery"
                          label="Nombre o apellido"
                          defaultValue={state.filters.personQuery}
                          helperText="Ingresa al menos 2 letras."
                          fullWidth
                        />
                        <Button type="submit" variant="contained" size="large">
                          Buscar
                        </Button>
                      </Stack>
                    </form>

                    {state.people.length > 0 ? (
                      <List sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                        {state.people.map((person) => (
                          <ListItem
                            key={person.id}
                            secondaryAction={
                              <form action="/solicitar">
                                <input type="hidden" name="selectedPersonId" value={person.id} />
                                <input type="hidden" name="personQuery" value={state.filters.personQuery} />
                                <Button type="submit" variant="outlined">
                                  Seleccionar
                                </Button>
                              </form>
                            }
                          >
                            <ListItemText
                              primary={`${person.firstName} ${person.lastName}`}
                              secondary={
                                person.pinLockedUntil && person.pinLockedUntil > new Date()
                                  ? "PIN bloqueado temporalmente"
                                  : "Persona activa"
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : state.filters.personQuery ? (
                      <Alert severity="info">No se encontraron personas activas con ese criterio.</Alert>
                    ) : null}
                  </Stack>
                </CardContent>
              </Card>

              {state.selectedPerson ? (
                <Card elevation={0} sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
                  <CardContent>
                    <Stack spacing={2.5}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        <LockOpenRoundedIcon color="primary" />
                        <Typography variant="h5">2. Valida tu PIN</Typography>
                      </Stack>
                      <Typography color="text.secondary">
                        Persona seleccionada: <strong>{state.selectedPerson.firstName} {state.selectedPerson.lastName}</strong>
                      </Typography>
                      <form action={authenticatePublicPersonAction}>
                        <Stack spacing={2}>
                          <input type="hidden" name="personId" value={state.selectedPerson.id} />
                          <input type="hidden" name="returnTo" value="/solicitar" />
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
                          <Button type="submit" variant="contained" size="large">
                            Entrar al flujo publico
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
              <Card elevation={0} sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
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
                        Sesion activa para {state.currentPerson.firstName} {state.currentPerson.lastName}
                      </Typography>
                      <Typography color="text.secondary">
                        Puedes registrar solicitudes pendientes y cancelar las que aun no hayan sido revisadas.
                      </Typography>
                    </Box>
                    <form action={logoutPublicPersonAction}>
                      <Button type="submit" variant="outlined" startIcon={<LogoutRoundedIcon />}>
                        Cerrar sesion
                      </Button>
                    </form>
                  </Stack>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
                <CardContent>
                  <Stack spacing={2.5}>
                    <Typography variant="h5">Filtrar turnos visibles</Typography>
                    <form action="/solicitar">
                      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                        <FormControl fullWidth>
                          <InputLabel id="zone-filter-label">Zona</InputLabel>
                          <Select
                            labelId="zone-filter-label"
                            name="zoneId"
                            defaultValue={state.filters.zoneId}
                            label="Zona"
                          >
                            <MenuItem value="">Todas</MenuItem>
                            {state.zones.map((zone) => (
                              <MenuItem key={zone.id} value={zone.id}>
                                {zone.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField name="from" type="date" label="Desde" defaultValue={state.filters.from} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                        <TextField name="to" type="date" label="Hasta" defaultValue={state.filters.to} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                        <Button type="submit" variant="outlined" size="large">
                          Aplicar
                        </Button>
                      </Stack>
                    </form>
                  </Stack>
                </CardContent>
              </Card>

              <form action={submitShiftRequestsAction}>
                <Stack spacing={3}>
                  <Card elevation={0} sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
                    <CardContent>
                      <Stack spacing={2.5}>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                          <EventAvailableRoundedIcon color="primary" />
                          <Typography variant="h5">Turnos disponibles para solicitar</Typography>
                        </Stack>
                        <Typography color="text.secondary">
                          Selecciona uno o varios turnos abiertos. La sugerencia de pareja es opcional y se aplica a toda esta solicitud múltiple.
                        </Typography>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                          <FormControl fullWidth>
                            <InputLabel id="partner-label">Pareja sugerida opcional</InputLabel>
                            <Select labelId="partner-label" name="suggestedPartnerId" defaultValue="" label="Pareja sugerida opcional">
                              <MenuItem value="">Sin sugerencia</MenuItem>
                              {state.partnerOptions.map((partner) => (
                                <MenuItem key={partner.id} value={partner.id}>
                                  {partner.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <TextField
                            name="comments"
                            label="Comentario general"
                            placeholder="Observacion opcional para estas solicitudes"
                            fullWidth
                          />
                        </Stack>

                        <Divider />

                        {state.shiftBoard.length > 0 ? (
                          <Stack spacing={2}>
                            {state.shiftBoard.map((shift) => {
                              const disabled =
                                shift.status !== "OPEN" ||
                                shift.ownLatestRequest?.status === "PENDING" ||
                                shift.ownLatestRequest?.status === "CONFIRMED";

                              return (
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
                                    <Stack spacing={1.5}>
                                      <Stack
                                        direction={{ xs: "column", md: "row" }}
                                        spacing={1.5}
                                        sx={{
                                          justifyContent: "space-between",
                                          alignItems: { xs: "flex-start", md: "center" },
                                        }}
                                      >
                                        <Box>
                                          <Typography variant="h6">{shift.zoneName}</Typography>
                                          <Typography color="text.secondary">
                                            {shift.dateLabel} · {shift.startLabel} - {shift.endLabel}
                                          </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                                          <Chip label={shift.status === "OPEN" ? "Abierto" : "Completo"} color={shift.status === "OPEN" ? "success" : "default"} />
                                          <Chip label={`${shift.pendingCount} pendientes`} variant="outlined" />
                                          <Chip label={`${shift.confirmedCount} confirmados`} variant="outlined" />
                                        </Stack>
                                      </Stack>

                                      {shift.ownLatestRequest ? (
                                        <Alert severity={shift.ownLatestRequest.status === "PENDING" ? "info" : "success"}>
                                          Ya tienes una solicitud {shift.ownLatestRequest.status.toLowerCase()} para este turno.
                                        </Alert>
                                      ) : null}

                                      {shift.publicAssignments.length > 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                          Asignaciones publicas: {shift.publicAssignments.map((item) => item.label).join(", ")}
                                        </Typography>
                                      ) : null}

                                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Checkbox name="shiftIds" value={shift.id} disabled={disabled || state.config.maintenanceModeEnabled} />
                                        <Typography variant="body2">
                                          {disabled ? "No disponible para nueva solicitud" : "Incluir en esta solicitud"}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </Stack>
                        ) : (
                          <Alert severity="info">
                            No hay turnos publicos visibles en el rango seleccionado.
                          </Alert>
                        )}

                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          disabled={state.config.maintenanceModeEnabled || state.shiftBoard.length === 0}
                        >
                          Registrar solicitudes seleccionadas
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </form>

              <Card elevation={0} sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
                <CardContent>
                  <Stack spacing={2.5}>
                    <Typography variant="h5">Mis solicitudes pendientes</Typography>
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
                                  alignItems: { xs: "flex-start", md: "center" },
                                }}
                              >
                                <Box>
                                  <Typography variant="h6">{request.shift.zone.name}</Typography>
                                  <Typography color="text.secondary">
                                    {request.shift.shiftDate.toISOString().slice(0, 10)} · {request.shift.startTime.toISOString().slice(11, 16)} - {request.shift.endTime.toISOString().slice(11, 16)}
                                  </Typography>
                                  {request.suggestedPartner ? (
                                    <Typography variant="body2" color="text.secondary">
                                      Pareja sugerida: {request.suggestedPartner.firstName} {request.suggestedPartner.lastName}
                                    </Typography>
                                  ) : null}
                                  {request.comments ? (
                                    <Typography variant="body2" color="text.secondary">
                                      Nota: {request.comments}
                                    </Typography>
                                  ) : null}
                                </Box>
                                <form action={cancelOwnPendingRequestAction}>
                                  <input type="hidden" name="requestId" value={request.id} />
                                  <Button type="submit" variant="outlined" color="error">
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
                        No tienes solicitudes pendientes. Tambien puedes revisar tus confirmaciones en{" "}
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
  );
}
