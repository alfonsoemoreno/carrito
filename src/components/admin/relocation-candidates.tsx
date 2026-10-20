import { Box, Button, Stack, Typography } from "@mui/material";
import type { RelocationCandidate } from "@/features/admin/assignment/relocation";

export function RelocationCandidates({ candidates }: { candidates: RelocationCandidate[] }) {
  if (candidates.length === 0) return null;

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle1">Solicitantes en otros lugares · mismo día y horario</Typography>
      <Typography variant="body2" color="text.secondary">
        Consulta el cambio por WhatsApp. Envía el mensaje y espera la aceptación antes de confirmar la pareja en Resolver turno.
      </Typography>
      {candidates.map((candidate) => (
        <Box key={candidate.personId} sx={{ borderLeft: "3px solid", borderColor: "info.main", pl: 1.5 }}>
          <Stack spacing={0.5}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{candidate.name}</Typography>
            <Typography variant="body2">Solicitó: {candidate.sourceZone}</Typography>
            {candidate.comments ? <Typography variant="body2">{candidate.comments}</Typography> : null}
            {candidate.notes ? <Typography variant="body2" color="text.secondary">Observaciones: {candidate.notes}</Typography> : null}
            {candidate.whatsappHref ? (
              <Button href={candidate.whatsappHref} target="_blank" rel="noopener noreferrer" variant="outlined" size="small" sx={{ alignSelf: "flex-start" }}>
                Consultar cambio por WhatsApp a {candidate.name}
              </Button>
            ) : <Typography variant="body2" color="warning.main">Sin teléfono válido para WhatsApp. Actualízalo en Personas.</Typography>}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
