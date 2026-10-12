import assert from "node:assert/strict";
import test from "node:test";
import { directionsUrl, hasCoordinates, parseCoordinatePair } from "../src/lib/places-map";
import { saveZoneSchema } from "../src/features/admin/master-data/validations";

const zone = {
  id: "", name: "Costanera", description: "", status: "ACTIVE", publicVisible: true,
  address: "", latitude: "", longitude: "", mapColor: "#2563eb",
};

test("empty coordinates remain null and paired coordinates must be valid", () => {
  const empty = saveZoneSchema.parse(zone);
  assert.equal(empty.latitude, null);
  assert.equal(empty.longitude, null);
  assert.equal(saveZoneSchema.parse({ ...zone, latitude: " ", longitude: " " }).latitude, null);
  assert.equal(saveZoneSchema.safeParse({ ...zone, latitude: "-39.8142" }).success, false);
  for (const input of [
    { latitude: "91", longitude: "0" },
    { latitude: "0", longitude: "-181" },
    { latitude: "no", longitude: "0" },
    { latitude: "Infinity", longitude: "0" },
  ]) assert.equal(saveZoneSchema.safeParse({ ...zone, ...input }).success, false);
  const origin = saveZoneSchema.parse({ ...zone, latitude: "0", longitude: "0" });
  assert.ok(hasCoordinates(origin));
});

test("coordinate paste preserves latitude / longitude order and rejects malformed pairs", () => {
  assert.deepEqual(parseCoordinatePair(" -39.8142, -73.2459 "), { latitude: -39.8142, longitude: -73.2459 });
  assert.deepEqual(parseCoordinatePair("-39.8142; -73.2459"), { latitude: -39.8142, longitude: -73.2459 });
  for (const input of ["", ",", "-39.8,", "-39.8,-73.2,0", "91,0", "0,181", "no,0"]) {
    assert.equal(parseCoordinatePair(input), null);
  }
});

test("a missing coordinate never creates an accidental point at zero", () => {
  assert.equal(hasCoordinates({ latitude: null, longitude: null }), false);
  assert.equal(hasCoordinates({ latitude: -39, longitude: null }), false);
  assert.equal(hasCoordinates({ latitude: NaN, longitude: 0 }), false);
  assert.equal(hasCoordinates({ latitude: 0, longitude: 0 }), true);
  const url = new URL(directionsUrl(-39.8142, -73.2459));
  assert.equal(url.searchParams.get("destination"), "-39.8142,-73.2459");
});
