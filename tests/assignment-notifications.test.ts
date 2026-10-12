import assert from "node:assert/strict";
import test from "node:test";
import { assignmentNotice, buildAssignmentWhatsAppLink, normalizeWhatsAppPhone } from "../src/lib/assignment-notifications";

test("normalizes Chilean mobiles and international prefixes without accepting extensions", () => {
  assert.equal(normalizeWhatsAppPhone("9 1234 5678"), "56912345678");
  assert.equal(normalizeWhatsAppPhone("+56 (9) 1234-5678"), "56912345678");
  assert.equal(normalizeWhatsAppPhone("0056 9 1234 5678"), "56912345678");
  for (const phone of [null, "", "1234", "+56 9 1234 5678 ext 12", "00000000000"]) {
    assert.equal(normalizeWhatsAppPhone(phone), null);
  }
});

test("prepares an individual chat with encoded details and the correct cancellation notice", () => {
  const input = {
    phone: "+56 9 1234 5678", name: "María", partner: "José",
    status: "CANCELLED", zone: "Zona A & B", date: "26 oct 2026",
    time: "10:00 - 12:00", siteUrl: "https://example.com",
  };
  const url = new URL(buildAssignmentWhatsAppLink(input)!);
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/56912345678");
  const text = url.searchParams.get("text")!;
  assert.ok(text.includes("María"));
  assert.ok(text.includes("Zona A & B"));
  assert.ok(text.includes(assignmentNotice("CANCELLED")));
  assert.ok(text.includes("https://example.com/asignaciones"));
  assert.ok(!text.includes(assignmentNotice("CONFIRMED")));
  assert.equal(buildAssignmentWhatsAppLink({ ...input, phone: null }), null);
  assert.ok(assignmentNotice("REPLACED").includes("ya no está confirmada"));
});
