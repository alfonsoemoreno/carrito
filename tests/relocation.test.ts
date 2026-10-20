import assert from "node:assert/strict";
import test from "node:test";
import { isSameSlotInOtherZone, relocationCandidates } from "../src/features/admin/assignment/relocation";
import { buildRelocationWhatsAppLink } from "../src/lib/assignment-notifications";

const target = {
  id: "target", zoneId: "zone-a", zone: { name: "Valdivia TV" },
  shiftDate: new Date("2026-10-26T00:00:00Z"),
  startTime: new Date("1970-01-01T18:30:00Z"),
  endTime: new Date("1970-01-01T20:00:00Z"),
  requests: [{ personId: "local" }],
};
const source = { ...target, id: "source", zoneId: "zone-b", zone: { name: "Hospital" } };
function request(id: string, personId: string, shift = source) {
  return {
    id, personId, shift, comments: "Comentario original",
    person: { firstName: "María", lastName: "Pérez", phone: "9 1234 5678", notes: "Observaciones" },
  };
}

test("solo ofrece cambios con el mismo día, inicio y fin, en otro lugar", () => {
  assert.equal(isSameSlotInOtherZone(target, source), true);
  for (const other of [
    { ...source, zoneId: target.zoneId },
    { ...source, shiftDate: new Date("2026-10-27T00:00:00Z") },
    { ...source, startTime: new Date("1970-01-01T18:00:00Z") },
    { ...source, endTime: new Date("1970-01-01T21:00:00Z") },
  ]) {
    assert.equal(isSameSlotInOtherZone(target, other), false);
  }
});

test("deduplica personas de varios lugares y excluye quienes ya solicitaron el destino", () => {
  const candidates = relocationCandidates(target, [
    request("one", "visitor"),
    request("two", "visitor", { ...source, id: "third", zoneId: "zone-c" }),
    request("three", "local"),
    request("four", "different-day", { ...source, shiftDate: new Date("2026-10-27T00:00:00Z") }),
  ]);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].personId, "visitor");
  assert.equal(candidates[0].sourceZone, "Hospital");
  assert.equal(candidates[0].comments, "Comentario original");
  assert.equal(candidates[0].notes, "Observaciones");
});

test("WhatsApp propone el cambio con ambos lugares y pide aceptación sin anunciar una asignación confirmada", () => {
  const candidate = relocationCandidates(target, [request("one", "visitor")])[0];
  const url = new URL(candidate.whatsappHref!);
  assert.equal(url.pathname, "/56912345678");
  const message = url.searchParams.get("text")!;
  for (const part of ["María", "Hospital", "Valdivia TV", "26", "18:30 - 20:00", "confirma por este chat", "quedará pendiente"]) {
    assert.ok(message.includes(part), part);
  }
  assert.equal(buildRelocationWhatsAppLink({
    phone: null, name: "María", sourceZone: "Hospital", targetZone: "Valdivia TV", date: "26 oct", time: "18:30 - 20:00",
  }), null);
});
