import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, KEY_LENGTH).toString("hex");

  return `scrypt:${salt}:${hash}`;
}

export function verifyPin(pin: string, encodedHash: string) {
  const [algorithm, salt, hash] = encodedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const providedHash = scryptSync(pin, salt, KEY_LENGTH);
  const storedHash = Buffer.from(hash, "hex");

  if (providedHash.length !== storedHash.length) {
    return false;
  }

  return timingSafeEqual(providedHash, storedHash);
}
