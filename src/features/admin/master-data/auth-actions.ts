"use server";

import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function claimInitialSuperadminAction() {
  const { data: session, error } = await auth.getSession();

  if (error || !session?.user) {
    throw new Error("Administrative session required.");
  }

  const existingAdmins = await prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
    },
  });

  const canBootstrap = existingAdmins.every((admin) =>
    admin.email.endsWith("@carrito.demo"),
  );

  if (!canBootstrap) {
    throw new Error("Initial superadmin bootstrap is no longer available.");
  }

  await prisma.adminUser.upsert({
    where: {
      email: session.user.email,
    },
    update: {
      authProviderId: session.user.id,
      displayName: session.user.name,
      role: "SUPERADMIN",
      status: "ACTIVE",
    },
    create: {
      authProviderId: session.user.id,
      email: session.user.email,
      displayName: session.user.name,
      role: "SUPERADMIN",
      status: "ACTIVE",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/cuenta");
}
