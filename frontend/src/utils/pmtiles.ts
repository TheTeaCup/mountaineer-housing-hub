import * as maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";

export function registerPMTiles() {
  if (typeof window === "undefined") return;

  // MapLibre 6 ships its worker separately. Let Next emit the same-version asset.
  maplibregl.setWorkerUrl(
    new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href,
  );
  const protocol = new Protocol();

  maplibregl.addProtocol("pmtiles", protocol.tile);
}
