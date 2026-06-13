import { createNeonAuth } from "@neondatabase/auth/next/server";

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const auth = createNeonAuth({
  baseUrl: getEnv("NEON_AUTH_BASE_URL"),
  cookies: {
    secret: getEnv("NEON_AUTH_COOKIE_SECRET"),
  },
});
