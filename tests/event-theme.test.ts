import assert from "node:assert/strict";
import test from "node:test";
import { resolveEventTheme, EVENT_THEMES } from "../src/theme/event-theme";
import { EVENT_EDITIONS } from "../src/lib/event-editions";
import { getAppTheme } from "../src/theme/theme";
import { EVENT, getEventDateRange, clampToEventDateRange, hasEventEnded } from "../src/lib/event";

test("uses Ironman by default, restores Tour explicitly and rejects misspelled themes", () => {
  assert.equal(resolveEventTheme(undefined), "ironman-valdivia");
  assert.equal(resolveEventTheme("tour-de-france"), "tour-de-france");
  assert.equal(resolveEventTheme("ironman-valdivia"), "ironman-valdivia");
  assert.throws(() => resolveEventTheme("ironman"), /Tema de evento desconocido/);
});

test("both event identities have independent icons, editions and light/dark palettes", () => {
  for (const id of ["tour-de-france", "ironman-valdivia"] as const) {
    assert.ok(EVENT_THEMES[id].iconDirectory.endsWith(id));
    assert.ok(EVENT_EDITIONS[id].startDate <= EVENT_EDITIONS[id].endDate);
    const light = getAppTheme("light", id);
    const dark = getAppTheme("dark", id);
    assert.notEqual(light.palette.background.default, dark.palette.background.default);
    assert.notEqual(light.palette.primary.main, dark.palette.primary.main);
  }
  assert.equal(getAppTheme("light", "tour-de-france").palette.secondary.main, "#f5ed00");
  assert.equal(getAppTheme("light", "ironman-valdivia").palette.primary.main, "#276e8a");
});

test("the public schedule uses the active edition and closes after its final Chilean day", () => {
  const range = getEventDateRange();
  assert.equal(range.from.toISOString().slice(0, 10), EVENT.startDate);
  assert.equal(range.to.toISOString().slice(0, 10), EVENT.endDate);
  assert.deepEqual(clampToEventDateRange(new Date("2020-01-01"), new Date("2030-01-01")), range);
  assert.equal(hasEventEnded(new Date(`${EVENT.endDate}T23:59:59-03:00`)), false);
  assert.equal(hasEventEnded(new Date(new Date(`${EVENT.endDate}T23:59:59-03:00`).getTime() + 1000)), true);
});
