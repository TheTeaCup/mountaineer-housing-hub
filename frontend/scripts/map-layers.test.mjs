import { featureFilter } from "@maplibre/maplibre-gl-style-spec";
import assert from "node:assert/strict";
import { test } from "node:test";
import { busLayerFilter } from "../src/utils/bus-route-filter.ts";
function matches(layer, selection, routeIds, type) {
  const compiled = featureFilter(
    busLayerFilter(layer, selection),
    "layers[0].filter",
  );
  return compiled.filter({ zoom: 13 }, { type, properties: { routeIds } });
}
for (const [layer, type] of [
  ["bus-route-outline", 2],
  ["bus-routes", 2],
  ["bus-stops", 1],
]) {
  test(`clear all hides ${layer} with a valid MapLibre expression`, () => {
    assert.equal(matches(layer, [], ["3", "4"], type), false);
    assert.equal(matches(layer, "", ["3"], type), false);
  });
  test(`multiple routes filter ${layer} by any selected route`, () => {
    assert.equal(matches(layer, ["3", "4"], ["3"], type), true);
    assert.equal(matches(layer, ["3", "4"], ["4", "9"], type), true);
    assert.equal(matches(layer, ["3", "4"], ["9"], type), false);
    assert.equal(matches(layer, "all", ["9"], type), true);
  });
}
