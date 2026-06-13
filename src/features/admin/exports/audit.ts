import { randomUUID } from "node:crypto";
import type { AdminUser } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ExportFilters = {
  from?: string | null | undefined;
  to?: string | null | undefined;
  zoneId?: string | null | undefined;
};

export function extractClientIp(forwardedFor: string | null) {
  if (!forwardedFor) {
    return null;
  }

  const first = forwardedFor
    .split(",")
    .map((entry) => entry.trim())
    .find(Boolean);

  return first ?? null;
}

export function normalizeExportAuditFilters(filters: ExportFilters) {
  return {
    from: filters.from ?? null,
    to: filters.to ?? null,
    zoneId: filters.zoneId ?? null,
  };
}

export async function recordAdminExportAudit(input: {
  admin: AdminUser;
  request: Request;
  exportType: "assignments" | "requests";
  fileName: string;
  rowCount: number;
  filters: ExportFilters;
}) {
  const ipAddress = extractClientIp(input.request.headers.get("x-forwarded-for"));
  const userAgent = input.request.headers.get("user-agent");

  await prisma.auditLog.create({
    data: {
      actorType: "ADMIN",
      entityType: "admin_export",
      entityId: randomUUID(),
      actorAdminId: input.admin.id,
      action:
        input.exportType === "assignments"
          ? "EXPORT_ASSIGNMENTS_CSV_DOWNLOADED"
          : "EXPORT_REQUESTS_CSV_DOWNLOADED",
      meta: {
        exportType: input.exportType,
        fileName: input.fileName,
        rowCount: input.rowCount,
        filters: normalizeExportAuditFilters(input.filters),
        ipAddress,
        userAgent,
      },
    },
  });
}
