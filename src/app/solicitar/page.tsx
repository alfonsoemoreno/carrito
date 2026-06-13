import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
} from "@mui/material";
import Link from "next/link";

export default function SolicitarPage() {
  return (
    <Box component="main" sx={{ py: { xs: 4, md: 7 } }}>
      <Container maxWidth="md">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="overline" color="primary.main">
              Flujo publico
            </Typography>
            <Typography variant="h3">Solicitud de turnos</Typography>
            <Typography variant="body1" color="text.secondary">
              Esta vista queda preparada como punto de entrada para la Fase 5.
              Aqui se conectaran la busqueda por persona, validacion de PIN,
              filtros por zona/fecha y seleccion multiple de turnos.
            </Typography>
          </Box>

          <Alert severity="info">
            El flujo completo de solicitud aun no esta implementado. La base de
            UI y navegacion ya esta lista.
          </Alert>

          <Card elevation={0} sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <EventAvailableRoundedIcon color="primary" />
                <Typography variant="h5">Proximos hitos</Typography>
                <Typography color="text.secondary">
                  Integrar autenticacion publica por PIN, listado de turnos,
                  sugerencia de pareja y cancelacion de pendientes.
                </Typography>
                <Link href="/">
                  <Button variant="outlined">Volver al inicio</Button>
                </Link>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}
