import { PersonStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPin } from "@/lib/pin";
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
  const pin = String(formData.get("pin") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/solicitar");

  if (!personId) {
    return redirectTo(
      buildRedirect(returnTo, {
        authError: "Selecciona una persona antes de ingresar el PIN.",
      }),
      request,
    );
  }

  const config = await prisma.systemConfig.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      pinMinLength: true,
      pinMaxLength: true,
      pinMaxAttempts: true,
      pinLockMinutes: true,
    },
  });

  const policy = {
    pinMinLength: config?.pinMinLength ?? 4,
    pinMaxLength: config?.pinMaxLength ?? 8,
    pinMaxAttempts: config?.pinMaxAttempts ?? 5,
    pinLockMinutes: config?.pinLockMinutes ?? 15,
  };

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

  if (pin.length < policy.pinMinLength || pin.length > policy.pinMaxLength) {
    return redirectTo(
      buildRedirect(returnTo, {
        selectedPersonId: personId,
        authError: `El PIN debe tener entre ${policy.pinMinLength} y ${policy.pinMaxLength} digitos.`,
      }),
      request,
    );
  }

  if (person.pinLockedUntil && person.pinLockedUntil > new Date()) {
    return redirectTo(
      buildRedirect(returnTo, {
        selectedPersonId: personId,
        authError: "El PIN esta bloqueado temporalmente. Intenta mas tarde.",
      }),
      request,
    );
  }

  const validPin = verifyPin(pin, person.pinHash);

  if (!validPin) {
    const nextAttempts = person.failedPinAttempts + 1;
    const shouldLock = nextAttempts >= policy.pinMaxAttempts;

    await prisma.person.update({
      where: { id: person.id },
      data: {
        failedPinAttempts: shouldLock ? 0 : nextAttempts,
        pinLockedUntil: shouldLock
          ? new Date(Date.now() + policy.pinLockMinutes * 60 * 1000)
          : null,
      },
    });

    return redirectTo(
      buildRedirect(returnTo, {
        selectedPersonId: personId,
        authError: shouldLock
          ? "Se alcanzo el maximo de intentos. El PIN quedo bloqueado temporalmente."
          : "El PIN ingresado no coincide.",
      }),
      request,
    );
  }

  await prisma.person.update({
    where: { id: person.id },
    data: {
      failedPinAttempts: 0,
      pinLockedUntil: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "PUBLIC_PERSON",
      entityType: "public_session",
      entityId: person.id,
      actorPersonId: person.id,
      action: "PIN_AUTHENTICATED",
      afterData: {
        at: new Date().toISOString(),
      },
    },
  });

  const response = redirectTo(
    buildRedirect(returnTo, { notice: "PIN validado correctamente." }),
    request,
  );
  const cookie = buildPublicSessionCookie(person.id);
  response.cookies.set(cookie.name, cookie.value, cookie.options);

  return response;
}
