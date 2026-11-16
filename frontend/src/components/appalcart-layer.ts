import feed from "@/data/appalcart.json";
import {
  Popup,
  type ExpressionSpecification,
  type FilterSpecification,
  type Map,
} from "maplibre-gl";

export const busRoutes = feed.routes;
export const busLayers = ["bus-route-outline", "bus-routes", "bus-stops"];

const appalCartData: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: (feed.data as GeoJSON.FeatureCollection).features.map((feature) => {
    if (feature.geometry.type !== "Point") return feature;
    const routeIds: string[] = feature.properties?.routeIds ?? [];
    return {
      ...feature,
      properties: {
        ...feature.properties,
        routeNames: JSON.stringify(
          busRoutes
            .filter(({ id }) => routeIds.includes(id))
            .map(({ name }) => name),
        ),
      },
    };
  }),
};

function busRouteFilter(selection: string): ExpressionSpecification {
  if (!selection) return ["!", ["has", "routeIds"]];
  if (selection === "all") return ["has", "routeIds"];
  return ["in", selection, ["get", "routeIds"]];
}

export function busLayerFilter(
  layer: string,
  selection: string,
): FilterSpecification {
  return [
    "all",
    ["==", ["geometry-type"], layer === "bus-stops" ? "Point" : "LineString"],
    busRouteFilter(selection),
  ];
}

export function addAppalCartLayers(map: Map, selection: string) {
  map.addSource("appalcart", {
    type: "geojson",
    data: appalCartData,
  });
  map.addLayer({
    id: "bus-route-outline",
    type: "line",
    source: "appalcart",
    filter: busLayerFilter("bus-route-outline", selection),
    paint: { "line-color": "#111827", "line-width": 5 },
    layout: { "line-join": "round", "line-cap": "round" },
  });
  map.addLayer({
    id: "bus-routes",
    type: "line",
    source: "appalcart",
    filter: busLayerFilter("bus-routes", selection),
    paint: { "line-color": ["get", "color"], "line-width": 3 },
    layout: { "line-join": "round", "line-cap": "round" },
  });
  map.addLayer({
    id: "bus-stops",
    type: "circle",
    source: "appalcart",
    filter: busLayerFilter("bus-stops", selection),
    paint: {
      "circle-radius": 4,
      "circle-color": "#ffffff",
      "circle-stroke-color": "#111827",
      "circle-stroke-width": 2,
    },
  });
  const popup = new Popup({
    className: "appalcart-stop-popup",
    closeButton: false,
    maxWidth: "min(18rem, calc(100vw - 2rem))",
    offset: 6,
  });
  map.on("click", "bus-stops", (event) => {
    const propertyLayers = ["property-icons", "property-labels"].filter((id) =>
      map.getLayer(id),
    );
    if (
      propertyLayers.length &&
      map.queryRenderedFeatures(event.point, {
        layers: propertyLayers,
      }).length
    )
      return;
    const stop = event.features?.[0];
    if (stop?.geometry.type !== "Point") return;
    const [longitude, latitude] = stop.geometry.coordinates;
    const wrappedLongitude =
      longitude + 360 * Math.round((event.lngLat.lng - longitude) / 360);
    const label = document.createElement("div");
    const name = document.createElement("strong");
    name.className = "appalcart-stop-name";
    name.textContent = stop.properties.name;
    label.append(name);
    const routeNames: string[] = JSON.parse(stop.properties.routeNames ?? "[]");
    if (routeNames.length) {
      const heading = document.createElement("div");
      heading.className = "appalcart-stop-routes-label";
      heading.textContent = "Served by";
      const routes = document.createElement("ul");
      routes.className = "appalcart-stop-routes";
      for (const route of routeNames) {
        const item = document.createElement("li");
        item.textContent = route;
        routes.append(item);
      }
      label.append(heading, routes);
    }
    popup
      .setLngLat([wrappedLongitude, latitude])
      .setDOMContent(label)
      .addTo(map);
  });
  map.on("mouseenter", "bus-stops", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "bus-stops", () => {
    map.getCanvas().style.cursor = "";
  });
  return popup;
}
