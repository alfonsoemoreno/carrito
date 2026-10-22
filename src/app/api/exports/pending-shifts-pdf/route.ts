import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdminActorOrNull } from "@/features/admin/master-data/auth";
import { recordAdminExportAudit } from "@/features/admin/exports/audit";
import { getPendingShiftsReportData } from "@/features/admin/exports/pending-shifts-queries";
import { buildPendingShiftsPdf } from "@/features/admin/exports/pending-shifts-pdf";

const filtersSchema = z.object({
  from: z.iso.date().nullish(),
  to: z.iso.date().nullish(),
  zoneId: z.uuid().nullish(),
}).refine((filters) => !filters.from || !filters.to || filters.from <= filters.to, "El rango de fechas no es válido.");

export async function GET(request: Request) {
  const admin = await getCurrentAdminActorOrNull();
  if (!admin) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const parsed = filtersSchema.safeParse({
    from: searchParams.get("from") || null,
    to: searchParams.get("to") || null,
    zoneId: searchParams.get("zoneId") || null,
  });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Revisa el lugar y el rango de fechas." }, { status: 400 });
  const data = await getPendingShiftsReportData(parsed.data);
  if (!data) return NextResponse.json({ ok: false, error: "Lugar no encontrado." }, { status: 404 });
  const pdf = buildPendingShiftsPdf(data);
  const suffix = parsed.data.zoneId ? data.scopeLabel.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "todos-los-lugares";
  const fileName = `turnos-pendientes-${suffix}.pdf`;
  await recordAdminExportAudit({ admin, request, exportType: "pending-shifts-pdf", fileName, rowCount: data.rows.length, filters: parsed.data });
  return new NextResponse(new Uint8Array(pdf), { headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "private, no-store, max-age=0",
  } });
}
