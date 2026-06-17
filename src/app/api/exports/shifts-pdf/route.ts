import { NextResponse } from "next/server";
import { recordAdminExportAudit } from "@/features/admin/exports/audit";
import { getZoneShiftPdfReportData } from "@/features/admin/exports/queries";
import * as zoneShiftsPdfModule from "@/features/admin/exports/zone-shifts-pdf";
import { getCurrentAdminActorOrNull } from "@/features/admin/master-data/auth";

const zoneShiftsPdfExports = zoneShiftsPdfModule as Record<string, unknown>;
const buildZoneShiftsPdf =
  typeof zoneShiftsPdfExports.buildZoneShiftsPdf === "function"
    ? zoneShiftsPdfExports.buildZoneShiftsPdf
    : typeof zoneShiftsPdfExports.default === "function"
      ? zoneShiftsPdfExports.default
      : null;

export async function GET(request: Request) {
  const admin = await getCurrentAdminActorOrNull();

  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const filters = {
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    zoneId: searchParams.get("zoneId"),
  };

  if (!filters.zoneId) {
    return NextResponse.json(
      { ok: false, error: "Debes seleccionar un lugar." },
      { status: 400 },
    );
  }

  const data = await getZoneShiftPdfReportData(filters);

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "No fue posible generar el reporte." },
      { status: 404 },
    );
  }

  if (!buildZoneShiftsPdf) {
    return NextResponse.json(
      { ok: false, error: "El generador PDF no está disponible." },
      { status: 500 },
    );
  }

  const pdf = buildZoneShiftsPdf(data);
  const fileName = `turnos-${data.zone.name.toLowerCase().replaceAll(/\s+/g, "-")}.pdf`;

  await recordAdminExportAudit({
    admin,
    request,
    exportType: "zone-shifts-pdf",
    fileName,
    rowCount: data.rows.length,
    filters,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
