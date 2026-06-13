import { NextResponse } from "next/server";
import { getRequestsExportRows } from "@/features/admin/exports/queries";
import { buildCsv } from "@/features/admin/stats/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rows = await getRequestsExportRows({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    zoneId: searchParams.get("zoneId"),
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

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="solicitudes.csv"',
    },
  });
}
