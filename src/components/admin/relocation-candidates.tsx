import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import type { RelocationCandidate } from "@/features/admin/assignment/relocation";

export function RelocationCandidates({ candidates, onSelect }: {
  candidates: RelocationCandidate[];
  onSelect?: (personId: string, slot: 1 | 2) => void;
}) {
  if (candidates.length === 0) return null;

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle1">Solicitantes en otros lugares · mismo día y horario</Typography>
      <Typography variant="body2" color="text.secondary">
        Consulta el cambio por WhatsApp. Envía el mensaje y espera la aceptación antes de confirmar la pareja en Resolver turno.
      </Typography>
      {[...candidates].sort((a, b) => a.confirmedAssignmentCount - b.confirmedAssignmentCount).map((candidate) => (
        <Box key={candidate.personId} sx={{ borderLeft: "3px solid", borderColor: "info.main", p: 1.5, bgcolor: "action.hover" }}>
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{candidate.name}</Typography>
              <Chip size="small" variant="outlined" label={`${candidate.confirmedAssignmentCount} turnos confirmados`} />
            </Stack>
            <Typography variant="body2">Solicitó: {candidate.sourceZone}</Typography>
            {candidate.comments ? <Typography variant="body2">{candidate.comments}</Typography> : null}
            {candidate.notes ? <Typography variant="body2" color="text.secondary">Observaciones: {candidate.notes}</Typography> : null}
            {onSelect ? (
              <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap", pt: 0.5 }}>
                <Button size="small" variant="outlined" onClick={() => onSelect(candidate.personId, 1)}>Elegir como persona 1</Button>
                <Button size="small" variant="outlined" onClick={() => onSelect(candidate.personId, 2)}>Elegir como persona 2</Button>
              </Stack>
            ) : null}
            {candidate.whatsappHref ? (
              <Button href={candidate.whatsappHref} target="_blank" rel="noopener noreferrer" aria-label={`Consultar cambio por WhatsApp a ${candidate.name}`} variant="outlined" size="small" sx={{ alignSelf: "flex-start" }}>
                Consultar por WhatsApp
              </Button>
            ) : <Typography variant="body2" color="warning.main">Sin teléfono válido para WhatsApp. Actualízalo en Personas.</Typography>}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
