import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";

export function registerPMTiles() {
  if (typeof window === "undefined") return;

  const protocol = new Protocol();

  maplibregl.addProtocol("pmtiles", protocol.tile);
}
