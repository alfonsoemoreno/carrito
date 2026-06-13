import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getCurrentAdminActorOrNull() {
  const { data: session, error } = await auth.getSession();

  if (error || !session?.user) {
    return null;
  }

  const adminUser = await prisma.adminUser.findFirst({
    where: {
      status: "ACTIVE",
      OR: [
        { authProviderId: session.user.id },
        { email: session.user.email },
      ],
    },
  });

  if (!adminUser) {
    return null;
  }

  if (adminUser.authProviderId !== session.user.id) {
    return prisma.adminUser.update({
      where: { id: adminUser.id },
      data: { authProviderId: session.user.id },
    });
  }

  return adminUser;
}

export async function requireCurrentAdminActor() {
  const adminUser = await getCurrentAdminActorOrNull();

  if (!adminUser) {
    throw new Error("Authenticated user is not registered as an administrator.");
  }

  return adminUser;
}

export async function requireCurrentAdminPageAccess() {
  const { data: session, error } = await auth.getSession();

  if (error || !session?.user) {
    redirect("/auth/sign-in");
  }

  const adminUser = await getCurrentAdminActorOrNull();

  if (!adminUser) {
    redirect("/admin/cuenta");
  }

  return adminUser;
}

export async function getCurrentAdminLinkStatus() {
  const { data: session, error } = await auth.getSession();

  if (error || !session?.user) {
    return {
      sessionUser: null,
      linkedAdmin: null,
      canBootstrap: false,
    };
  }

  const [linkedAdmin, admins] = await Promise.all([
    prisma.adminUser.findFirst({
      where: {
        OR: [
          { authProviderId: session.user.id },
          { email: session.user.email },
        ],
      },
    }),
    prisma.adminUser.findMany({
      select: {
        email: true,
        role: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const canBootstrap = admins.every((admin) => admin.email.endsWith("@carrito.demo"));

  return {
    sessionUser: session.user,
    linkedAdmin,
    canBootstrap,
  };
}
