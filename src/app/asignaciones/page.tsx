import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Container,
  Typography,
} from "@mui/material";

export default function AsignacionesPage() {
  return (
    <Box component="main" sx={{ py: { xs: 4, md: 7 } }}>
      <Container maxWidth="md">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Typography variant="h3">Consulta de asignaciones</Typography>
          <Alert severity="info">
            La vista publica y la consulta personal por PIN se implementaran en
            la Fase 5. Este endpoint ya existe para anclar la navegacion.
          </Alert>
          <Card elevation={0} sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <AssignmentRoundedIcon color="primary" />
                <Typography variant="h5">Base prevista</Typography>
                <Typography color="text.secondary">
                  Se mostraran filtros por fecha y zona, mas una consulta
                  personal con historial sujeto a configuracion.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}
