import { Box, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";
import { getPrintableCalendarData } from "@/features/admin/stats/queries";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminPrintableCalendarPage({ searchParams }: Props) {
  await requireCurrentAdminPageAccess();
  const state = await getPrintableCalendarData(searchParams);

  return (
    <Box
      sx={{
        py: { xs: 3, md: 5 },
        "@media print": {
          py: 0,
        },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h3">Calendario imprimible</Typography>
            <Typography color="text.secondary">
              Rango {state.range.fromValue} a {state.range.toValue}
            </Typography>
          </Box>

          {state.shifts.map((shift) => (
            <Card key={shift.id} sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", "@media print": { boxShadow: "none", breakInside: "avoid" } }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h5">{shift.zoneName}</Typography>
                  <Typography color="text.secondary">
                    {shift.dateLabel} · {shift.timeLabel}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estado: {shift.status}
                  </Typography>
                  <Typography variant="body2">
                    {shift.assignments.length > 0 ? `Asignados: ${shift.assignments.join(" · ")}` : "Sin asignacion confirmada"}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
