import { NextResponse } from "next/server";
import { getCurrentAdminActorOrNull } from "@/features/admin/master-data/auth";
import { recordAdminExportAudit } from "@/features/admin/exports/audit";
import { dailyShiftsFiltersSchema } from "@/features/admin/exports/daily-shifts";
import { getDailyShiftsReportData } from "@/features/admin/exports/daily-shifts-queries";
import { buildDailyShiftsPdf } from "@/features/admin/exports/daily-shifts-pdf";

export async function GET(request: Request) {
  const admin = await getCurrentAdminActorOrNull();
  if (!admin) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const parsed = dailyShiftsFiltersSchema.safeParse({ date: searchParams.get("date") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Selecciona un día válido para el reporte." }, { status: 400 });
  const data = await getDailyShiftsReportData(parsed.data.date);
  const pdf = buildDailyShiftsPdf(data);
  const fileName = `turnos-del-dia-${data.date}.pdf`;
  await recordAdminExportAudit({
    admin, request, exportType: "daily-shifts-pdf", fileName, rowCount: data.rows.length,
    filters: { from: data.date, to: data.date, zoneId: null },
  });
  return new NextResponse(new Uint8Array(pdf), { headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "private, no-store, max-age=0",
  } });
}
