import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireCurrentAdminActor } from "./auth";

type NeonAuthUser = {
  id: string;
  name: string;
  email: string;
};

export async function getAdminManagementData() {
  const actor = await requireCurrentAdminActor();

  if (actor.role !== "SUPERADMIN") {
    redirect("/admin");
  }
  const [admins, candidates] = await Promise.all([
    prisma.adminUser.findMany({
      orderBy: [{ status: "asc" }, { displayName: "asc" }],
    }),
    prisma.$queryRaw<NeonAuthUser[]>`
      SELECT u.id::text AS id, u.name, u.email
      FROM neon_auth."user" AS u
      WHERE u."emailVerified" = true
        AND u.banned IS NOT TRUE
        AND NOT EXISTS (
          SELECT 1
          FROM public.admin_users AS a
          WHERE a.auth_provider_id = u.id::text
             OR lower(a.email) = lower(u.email)
        )
      ORDER BY u.name ASC, u.email ASC
    `,
  ]);

  return { actor, admins, candidates };
}
