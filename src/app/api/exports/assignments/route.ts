import { NextResponse } from "next/server";
import { getAssignmentsExportRows } from "@/features/admin/exports/queries";
import { buildCsv } from "@/features/admin/stats/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rows = await getAssignmentsExportRows({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    zoneId: searchParams.get("zoneId"),
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

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="asignaciones.csv"',
    },
  });
}
