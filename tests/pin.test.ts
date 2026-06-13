import assert from "node:assert/strict";
import test from "node:test";
import { hashPin, verifyPin } from "../src/lib/pin";

test("hashPin genera un hash scrypt verificable", () => {
  const hash = hashPin("1234");

  assert.match(hash, /^scrypt:[0-9a-f]+:[0-9a-f]+$/);
  assert.equal(verifyPin("1234", hash), true);
});

test("verifyPin rechaza PIN incorrecto o hash invalido", () => {
  const hash = hashPin("1234");

  assert.equal(verifyPin("0000", hash), false);
  assert.equal(verifyPin("1234", "invalid"), false);
});
