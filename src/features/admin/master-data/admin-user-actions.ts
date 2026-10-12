"use server";

import { AdminStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireCurrentSuperadminActor } from "./auth";

const authUserIdSchema = z.string().uuid();
const adminStatusSchema = z.nativeEnum(AdminStatus);
const adminUserIdSchema = z.string().uuid();

export async function grantAdminAccessAction(formData: FormData) {
  await requireCurrentSuperadminActor();
  const authUserId = authUserIdSchema.parse(formData.get("authUserId"));
  const [authUser] = await prisma.$queryRaw<Array<{
    id: string;
    name: string;
    email: string;
  }>>`
    SELECT id::text AS id, name, email
    FROM neon_auth."user"
    WHERE id = CAST(${authUserId} AS uuid)
      AND "emailVerified" = true
      AND banned IS NOT TRUE
    LIMIT 1
  `;

  if (!authUser) {
    throw new Error("Only verified, active Neon Auth users can be added as administrators.");
  }

  const existingAdmin = await prisma.adminUser.findFirst({
    where: {
      OR: [
        { authProviderId: authUser.id },
        { email: { equals: authUser.email, mode: "insensitive" } },
      ],
    },
  });

  if (existingAdmin) {
    throw new Error("This user already has an administrator record.");
  }

  await prisma.adminUser.create({
    data: {
      authProviderId: authUser.id,
      role: "ADMIN",
      status: "ACTIVE",
      displayName: authUser.name,
      email: authUser.email,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/administradores");
}

export async function updateAdminStatusAction(formData: FormData) {
  const actor = await requireCurrentSuperadminActor();
  const adminUserId = adminUserIdSchema.parse(formData.get("adminUserId"));
  const status = adminStatusSchema.parse(formData.get("status"));
  const target = await prisma.adminUser.findUnique({ where: { id: adminUserId } });

  if (!target) {
    throw new Error("Administrator not found.");
  }

  if (target.id === actor.id) {
    throw new Error("You cannot change your own administrator access.");
  }

  if (target.status === "ACTIVE" && status === "INACTIVE" && target.role === "SUPERADMIN") {
    const activeSuperadmins = await prisma.adminUser.count({
      where: { role: "SUPERADMIN", status: "ACTIVE" },
    });

    if (activeSuperadmins <= 1) {
      throw new Error("At least one active superadministrator must remain.");
    }
  }

  if (status === "ACTIVE") {
    const [authUser] = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id::text AS id
      FROM neon_auth."user"
      WHERE id::text = ${target.authProviderId}
        AND "emailVerified" = true
        AND banned IS NOT TRUE
      LIMIT 1
    `;

    if (!authUser) {
      throw new Error("This Neon Auth account must be active and email-verified before access can be restored.");
    }
  }

  await prisma.adminUser.update({
    where: { id: target.id },
    data: { status },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/administradores");
}
