import type { ExpressionSpecification, FilterSpecification } from "maplibre-gl";

function busRouteFilter(selection: string | string[]): ExpressionSpecification {
  if (selection === "all") return ["has", "routeIds"];
  const ids = Array.isArray(selection)
    ? selection
    : selection
      ? [selection]
      : [];
  if (!ids.length) return ["!", ["has", "routeIds"]];
  return [
    "any",
    ...ids.map((id): ExpressionSpecification => [
      "in",
      id,
      ["get", "routeIds"],
    ]),
  ];
}

export function busLayerFilter(
  layer: string,
  selection: string | string[],
): FilterSpecification {
  return [
    "all",
    ["==", ["geometry-type"], layer === "bus-stops" ? "Point" : "LineString"],
    busRouteFilter(selection),
  ];
}
