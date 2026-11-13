import { z } from "zod";
import { notFound } from "next/navigation";
import { Alert, Container, Stack } from "@mui/material";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { PlaceScheduleManager } from "@/components/admin/place-schedule-manager";
import { RouteButton } from "@/components/navigation/route-button";
import { requireCurrentAdminPageAccess } from "@/features/admin/master-data/auth";
import { formatTime } from "@/features/admin/master-data/utils";
import { loadScheduleSnapshot } from "@/features/admin/scheduling/service";
import { addDays } from "@/features/admin/scheduling/planning";
import { startOfTodayUtc, toDateOnlyString } from "@/features/public/utils";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ zoneId: string }>; searchParams: Promise<{ week?: string; view?: string }> };
export default async function PlaceSchedulePage({ params, searchParams }: Props) {
  await requireCurrentAdminPageAccess();
  const { zoneId } = await params;
  if (!z.string().uuid().safeParse(zoneId).success) notFound();
  const query = await searchParams;
  const today = toDateOnlyString(startOfTodayUtc());
  const parsedWeek = z.string().date().safeParse(query.week);
  const selected = parsedWeek.success ? parsedWeek.data : today;
  const week = addDays(selected, -((new Date(`${selected}T00:00:00Z`).getUTCDay() + 6) % 7));
  const [snapshot, zone, copyZones, assignments] = await Promise.all([
    prisma.$transaction((tx) => loadScheduleSnapshot(tx, zoneId)),
    prisma.zone.findUnique({ where: { id: zoneId }, select: { name: true, publicVisible: true } }),
    prisma.zone.findMany({
      where: { id: { not: zoneId }, status: "ACTIVE" }, orderBy: { name: "asc" },
      select: { id: true, name: true, templates: { where: { status: "ACTIVE", OR: [{ validTo: null }, { validTo: { gte: startOfTodayUtc() } }] }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] } },
    }),
    prisma.assignment.findMany({
      where: { status: "CONFIRMED", shift: { zoneId, shiftDate: { gte: new Date(`${week}T00:00:00Z`), lte: new Date(`${addDays(week, 6)}T00:00:00Z`) } } },
      select: { shiftId: true, person1: { select: { firstName: true, lastName: true } }, person2: { select: { firstName: true, lastName: true } } },
    }),
  ]);
  if (!snapshot || !zone) notFound();
  const copyOptions = copyZones.filter((p) => p.templates.length).map((p) => ({ id: p.id, name: p.name, templates: p.templates.map((t) => ({ id: t.id, dayOfWeek: t.dayOfWeek, startTime: formatTime(t.startTime), endTime: formatTime(t.endTime), status: t.status, validFrom: toDateOnlyString(t.validFrom), validTo: t.validTo ? toDateOnlyString(t.validTo) : null })) }));
  const labels = Object.fromEntries(assignments.map((a) => [a.shiftId, `${a.person1.firstName} ${a.person1.lastName} · ${a.person2.firstName} ${a.person2.lastName}`]));
  return <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
    <AdminPageShell eyebrow="Turnos por lugar" title={zone.name} description="Configura sus horarios, crea turnos y resuelve excepciones desde un mismo lugar.">
      <Stack direction="row" spacing={1}><RouteButton href="/admin/zonas" variant="outlined">Volver a lugares</RouteButton></Stack>
      {!zone.publicVisible && <Alert severity="info">Este lugar está oculto al público. Sus turnos se conservan y puedes administrarlos aquí.</Alert>}
      <PlaceScheduleManager snapshot={snapshot} today={today} week={week} initialView={query.view === "calendar" ? "calendar" : "schedules"} copyOptions={copyOptions} assignmentLabels={labels} />
    </AdminPageShell>
  </Container>;
}
