import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicSession, PUBLIC_SESSION_COOKIE } from "@/features/public/session";

function buildRedirectUrl(path: string, request: Request) {
  const url = new URL(path, request.url);

  if (
    process.env.NODE_ENV === "development" &&
    (url.hostname === "0.0.0.0" || url.hostname === "127.0.0.1")
  ) {
    url.hostname = "localhost";
  }

  return url;
}

export async function POST(request: Request) {
  const session = await getPublicSession();

  if (session?.personId) {
    await prisma.auditLog.create({
      data: {
        actorType: "PUBLIC_PERSON",
        entityType: "public_session",
        entityId: session.personId,
        actorPersonId: session.personId,
        action: "PUBLIC_SESSION_CLOSED",
      },
    });
  }

  const redirectUrl = buildRedirectUrl("/solicitar?notice=Sesion%20cerrada.", request);
  const response = NextResponse.redirect(redirectUrl, 303);
  response.cookies.delete(PUBLIC_SESSION_COOKIE);

  return response;
}
