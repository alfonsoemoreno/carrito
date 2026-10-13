import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import {
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
import { notFound } from "next/navigation";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { EmptyState } from "@/components/admin/master-data-cards";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";
import { formatDate, formatTime } from "@/features/admin/master-data/utils";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ personId: string }>;
};

export default async function AdminPersonAssignmentsPage({ params }: Props) {
  await requireCurrentAdminPageAccess();
  const { personId } = await params;

  const person = await prisma.person.findUnique({
    where: { id: personId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
    },
  });

  if (!person) {
    notFound();
  }

  const assignments = await prisma.assignment.findMany({
    where: {
      status: "CONFIRMED",
      OR: [{ person1Id: person.id }, { person2Id: person.id }],
    },
    include: {
      shift: {
        include: {
          zone: { select: { name: true } },
        },
      },
      person1: { select: { id: true, firstName: true, lastName: true } },
      person2: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: [{ shift: { shiftDate: "asc" } }, { shift: { startTime: "asc" } }],
  });

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <AdminPageShell
          eyebrow="Participantes"
          title={`Turnos asignados: ${person.firstName} ${person.lastName}`}
          description="Turnos con asignación confirmada, incluidos los que ya ocurrieron."
        >
          <Button
            component={Link}
            href="/admin/personas"
            startIcon={<ArrowBackRoundedIcon />}
            sx={{ alignSelf: "flex-start" }}
          >
            Volver a participantes
          </Button>

          <Stack direction="row" spacing={1}>
            <Chip
              label={person.status === "ACTIVE" ? "Participante activo" : "Participante inactivo"}
              color={person.status === "ACTIVE" ? "success" : "default"}
              variant="outlined"
            />
            <Chip label={`${assignments.length} turnos`} variant="outlined" />
          </Stack>

          {assignments.length === 0 ? (
            <EmptyState
              title="Sin turnos asignados"
              body="Esta persona no tiene asignaciones confirmadas."
            />
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              {assignments.map((assignment) => {
                const partner =
                  assignment.person1.id === person.id
                    ? assignment.person2
                    : assignment.person1;

                return (
                  <Card
                    key={assignment.id}
                    sx={{ borderRadius: 0, border: "1px solid", borderColor: "divider" }}
                  >
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Typography variant="h6">
                          {formatDate(assignment.shift.shiftDate)}
                        </Typography>
                        <Typography color="text.secondary">
                          {formatTime(assignment.shift.startTime)}–{formatTime(assignment.shift.endTime)}
                        </Typography>
                        <Typography>
                          <strong>Lugar:</strong> {assignment.shift.zone.name}
                        </Typography>
                        <Typography>
                          <strong>Compañero/a:</strong> {partner.firstName} {partner.lastName}
                        </Typography>
                        <Button
                          component={Link}
                          href={`/admin/turnos/${assignment.shift.id}`}
                          variant="outlined"
                          sx={{ alignSelf: "flex-start" }}
                        >
                          Ver turno
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </AdminPageShell>
      </Container>
    </Box>
  );
}
