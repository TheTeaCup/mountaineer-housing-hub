/** Refresh map data: npm run data:appalcart -- [gtfs.zip] */
import { parse } from "csv-parse/sync";
import { strFromU8, unzipSync } from "fflate";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

export const FEED =
  "https://s3.amazonaws.com/etatransit.gtfs/appalcart.etaspot.net/gtfs.zip";

function readTable(archive, name) {
  const entry = archive[`${name}.txt`];
  if (!entry) throw new Error(`GTFS feed is missing ${name}.txt`);
  return parse(strFromU8(entry), {
    columns: true,
    bom: true,
    skip_empty_lines: true,
  });
}
function coordinate(value, label) {
  const number = Number(value);
  if (!String(value).trim() || !Number.isFinite(number))
    throw new Error(`Invalid GTFS ${label}: ${value}`);
  return number;
}
const feature = (type, coordinates, properties) => ({
  type: "Feature",
  geometry: { type, coordinates },
  properties,
});
const sorted = (values) => [...values].sort();

export function buildData(archive) {
  const shapes = new Map();
  for (const row of readTable(archive, "shapes")) {
    const point = [
      coordinate(row.shape_pt_lon, "longitude"),
      coordinate(row.shape_pt_lat, "latitude"),
    ];
    if (!shapes.has(row.shape_id)) shapes.set(row.shape_id, []);
    shapes
      .get(row.shape_id)
      .push([coordinate(row.shape_pt_sequence, "shape sequence"), point]);
  }
  const tripRoutes = new Map();
  const routeShapes = new Map();
  for (const trip of readTable(archive, "trips")) {
    tripRoutes.set(trip.trip_id, trip.route_id);
    if (!routeShapes.has(trip.route_id))
      routeShapes.set(trip.route_id, new Set());
    routeShapes.get(trip.route_id).add(trip.shape_id);
  }
  const stopRoutes = new Map();
  for (const row of readTable(archive, "stop_times")) {
    if (!tripRoutes.has(row.trip_id)) continue;
    if (!stopRoutes.has(row.stop_id)) stopRoutes.set(row.stop_id, new Set());
    stopRoutes.get(row.stop_id).add(tripRoutes.get(row.trip_id));
  }
  const routes = [];
  const features = [];
  for (const row of readTable(archive, "routes")) {
    const name = row.route_long_name || row.route_short_name;
    const normalizedName = name.trim().toLowerCase();
    if (
      normalizedName.startsWith("game day ") ||
      normalizedName.includes("night owl")
    )
      continue;
    const lines = sorted(routeShapes.get(row.route_id) || []).flatMap(
      (shapeId) => {
        const points = shapes.get(shapeId) || [];
        return points.length < 2
          ? []
          : [points.toSorted((a, b) => a[0] - b[0]).map((point) => point[1])];
      },
    );
    if (!lines.length) continue;
    routes.push({ id: row.route_id, name });
    features.push(
      feature("MultiLineString", lines, {
        routeIds: [row.route_id],
        color: /^[0-9a-fA-F]{6}$/.test(row.route_color)
          ? `#${row.route_color}`
          : "#2563eb",
      }),
    );
  }
  const routeIds = new Set(routes.map((route) => route.id));
  for (const row of readTable(archive, "stops")) {
    const ids = sorted(stopRoutes.get(row.stop_id) || []).filter((id) =>
      routeIds.has(id),
    );
    if (ids.length && row.stop_lon && row.stop_lat)
      features.push(
        feature(
          "Point",
          [
            coordinate(row.stop_lon, "longitude"),
            coordinate(row.stop_lat, "latitude"),
          ],
          { routeIds: ids, name: row.stop_name },
        ),
      );
  }
  if (
    !routes.length ||
    !features.some((item) => item.geometry.type === "Point")
  )
    throw new Error("AppalCART feed contains no usable routes or stops");
  routes.sort((a, b) => {
    const left = a.name.toLowerCase();
    const right = b.name.toLowerCase();
    return left < right ? -1 : left > right ? 1 : 0;
  });
  return { routes, data: { type: "FeatureCollection", features } };
}

export async function updateAppalcart(
  input,
  output = new URL("../src/data/appalcart.json", import.meta.url),
) {
  let bytes;
  if (input) bytes = await readFile(input);
  else {
    const response = await fetch(FEED, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok)
      throw new Error(`AppalCART feed request failed: HTTP ${response.status}`);
    bytes = new Uint8Array(await response.arrayBuffer());
  }
  const data = buildData(unzipSync(bytes));
  await mkdir(new URL(".", output), { recursive: true });
  await writeFile(output, `${JSON.stringify(data)}\n`, "utf8");
  return data;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const data = await updateAppalcart(process.argv[2]);
    console.log(
      `Saved ${data.routes.length} routes and ${data.data.features.length} features to ${fileURLToPath(new URL("../src/data/appalcart.json", import.meta.url))}`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
