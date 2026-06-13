import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const PUBLIC_SESSION_COOKIE = "carrito_public_session";
const PUBLIC_SESSION_MAX_AGE = 60 * 60 * 12;

type PublicSessionPayload = {
  personId: string;
  issuedAt: number;
  expiresAt: number;
};

function getSessionSecret() {
  if (process.env.NEON_AUTH_COOKIE_SECRET) {
    return process.env.NEON_AUTH_COOKIE_SECRET;
  }

  if (process.env.NODE_ENV !== "production") {
    return "carrito-dev-public-session-secret";
  }

  throw new Error("NEON_AUTH_COOKIE_SECRET is required.");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encode(payload: PublicSessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(body);
  return `${body}.${signature}`;
}

function decode(rawCookie: string): PublicSessionPayload | null {
  const [body, signature] = rawCookie.split(".");

  if (!body || !signature) {
    return null;
  }

  const expectedSignature = sign(body);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PublicSessionPayload;

    if (
      !parsed.personId ||
      typeof parsed.issuedAt !== "number" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function getPublicSession() {
  const store = await cookies();
  const value = store.get(PUBLIC_SESSION_COOKIE)?.value;

  if (!value) {
    return null;
  }

  return decode(value);
}

export async function createPublicSession(personId: string) {
  const now = Date.now();
  const payload: PublicSessionPayload = {
    personId,
    issuedAt: now,
    expiresAt: now + PUBLIC_SESSION_MAX_AGE * 1000,
  };

  const store = await cookies();
  store.set(PUBLIC_SESSION_COOKIE, encode(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PUBLIC_SESSION_MAX_AGE,
  });
}

export async function clearPublicSession() {
  const store = await cookies();
  store.delete(PUBLIC_SESSION_COOKIE);
}
