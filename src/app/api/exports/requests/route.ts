import { NextResponse } from "next/server";
import { recordAdminExportAudit } from "@/features/admin/exports/audit";
import { getRequestsExportRows } from "@/features/admin/exports/queries";
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
  const rows = await getRequestsExportRows({
    ...filters,
  });

  const csv = buildCsv([
    ["id", "zona", "fecha", "horario", "persona", "estado", "pareja_sugerida", "comentario"],
    ...rows.map((row) => [
      row.id,
      row.zona,
      row.fecha,
      row.horario,
      row.persona,
      row.estado,
      row.parejaSugerida,
      row.comentario,
    ]),
  ]);

  await recordAdminExportAudit({
    admin,
    request,
    exportType: "requests",
    fileName: "solicitudes.csv",
    rowCount: rows.length,
    filters,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="solicitudes.csv"',
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
