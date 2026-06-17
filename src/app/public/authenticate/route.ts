import { PersonStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPublicSessionCookie } from "@/features/public/session";

function buildRedirect(path: string, params: Record<string, string | null | undefined>) {
  const url = new URL(path, "http://localhost");

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

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

function redirectTo(path: string, request: Request) {
  return NextResponse.redirect(buildRedirectUrl(path, request), 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const personId = String(formData.get("personId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/solicitar");

  if (!personId) {
    return redirectTo(
      buildRedirect(returnTo, {
        authError: "Selecciona una persona antes de continuar.",
      }),
      request,
    );
  }

  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      status: PersonStatus.ACTIVE,
    },
  });

  if (!person) {
    return redirectTo(
      buildRedirect(returnTo, {
        authError: "La persona seleccionada ya no esta disponible.",
      }),
      request,
    );
  }

  await prisma.auditLog.create({
    data: {
      actorType: "PUBLIC_PERSON",
      entityType: "public_session",
      entityId: person.id,
      actorPersonId: person.id,
      action: "PUBLIC_SESSION_STARTED",
      afterData: {
        at: new Date().toISOString(),
      },
    },
  });

  const response = redirectTo(
    buildRedirect(returnTo, { notice: "Acceso habilitado correctamente." }),
    request,
  );
  const cookie = buildPublicSessionCookie(person.id);
  response.cookies.set(cookie.name, cookie.value, cookie.options);

  return response;
}
