import { NextResponse } from "next/server";
import { recordAdminExportAudit } from "@/features/admin/exports/audit";
import { getAssignmentsExportRows } from "@/features/admin/exports/queries";
import { getCurrentAdminActorOrNull } from "@/features/admin/master-data/auth";
import { buildCsv } from "@/features/admin/stats/utils";

export async function GET(request: Request) {
  const admin = await getCurrentAdminActorOrNull();

  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filters = {
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    zoneId: searchParams.get("zoneId"),
  };
  const rows = await getAssignmentsExportRows({
    ...filters,
  });

  const csv = buildCsv([
    ["id", "zona", "fecha", "horario", "estado", "pareja", "excepcion", "motivo_excepcion"],
    ...rows.map((row) => [
      row.id,
      row.zone,
      row.fecha,
      row.horario,
      row.estado,
      row.pareja,
      row.excepcion,
      row.motivoExcepcion,
    ]),
  ]);

  await recordAdminExportAudit({
    admin,
    request,
    exportType: "assignments",
    fileName: "asignaciones.csv",
    rowCount: rows.length,
    filters,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="asignaciones.csv"',
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
