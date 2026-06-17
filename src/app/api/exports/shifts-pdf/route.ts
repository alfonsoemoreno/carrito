import { spawn } from "node:child_process";
import path from "node:path";
import { NextResponse } from "next/server";
import { recordAdminExportAudit } from "@/features/admin/exports/audit";
import { getZoneShiftPdfReportData } from "@/features/admin/exports/queries";
import { getCurrentAdminActorOrNull } from "@/features/admin/master-data/auth";

function runPdfRenderer(payload: unknown) {
  return new Promise<Buffer>((resolve, reject) => {
    const python = process.env.PYTHON_PDF_EXECUTABLE || "python3";
    const scriptPath = path.join(
      /* turbopackIgnore: true */ process.cwd(),
      "src/features/admin/exports/render_zone_shifts_report.py",
    );
    const child = spawn(python, [scriptPath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const chunks: Buffer[] = [];
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `PDF renderer exited with code ${code}`));
        return;
      }

      resolve(Buffer.concat(chunks));
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

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

  const pdf = await runPdfRenderer(data);
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
