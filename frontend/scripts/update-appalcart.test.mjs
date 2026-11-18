import { strToU8, zipSync } from "fflate";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { buildData, updateAppalcart } from "./update-appalcart.mjs";
const fixture = () =>
  Object.fromEntries(
    Object.entries({
      shapes:
        "shape_id,shape_pt_lon,shape_pt_lat,shape_pt_sequence\ns,-81.1,36.2,2\ns,-81.2,36.3,1\n",
      trips: "route_id,trip_id,shape_id\n1,a,s\n2,b,s\n3,c,s\n4,d,s\n",
      stop_times: "trip_id,stop_id\na,stop\nb,stop\nc,stop\nd,stop\n",
      routes:
        '\ufeffroute_id,route_long_name,route_short_name,route_color\n1,Blue,,0000FF\n2,"Gold, Express",,invalid\n3,Game Day Shuttle,,123456\n4,Night Owl,,123456\n',
      stops:
        'stop_id,stop_lon,stop_lat,stop_name\nstop,-81.2,36.3,"King St, downtown"\n',
    }).map(([name, csv]) => [`${name}.txt`, strToU8(csv)]),
  );
test("GTFS conversion preserves shape order, colors, quoted CSV and stop associations", () => {
  const result = buildData(fixture());
  assert.deepEqual(result.routes, [
    { id: "1", name: "Blue" },
    { id: "2", name: "Gold, Express" },
  ]);
  assert.deepEqual(result.data.features[0].geometry.coordinates, [
    [
      [-81.2, 36.3],
      [-81.1, 36.2],
    ],
  ]);
  assert.equal(result.data.features[0].properties.color, "#0000FF");
  assert.equal(result.data.features[1].properties.color, "#2563eb");
  assert.deepEqual(result.data.features[2].properties, {
    routeIds: ["1", "2"],
    name: "King St, downtown",
  });
});
test("missing tables and unusable feeds fail before saving", () => {
  const missing = fixture();
  delete missing["trips.txt"];
  assert.throws(() => buildData(missing), /missing trips/);
  const empty = fixture();
  empty["stops.txt"] = strToU8("stop_id,stop_lon,stop_lat,stop_name\n");
  assert.throws(() => buildData(empty), /no usable routes or stops/);
});
test("local ZIP input produces the expected JSON without a network request", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mhh-gtfs-"));
  try {
    const zip = join(dir, "gtfs.zip");
    const output = pathToFileURL(join(dir, "appalcart.json"));
    await writeFile(zip, zipSync(fixture()));
    await updateAppalcart(zip, output);
    assert.deepEqual(
      JSON.parse(await readFile(output, "utf8")),
      buildData(fixture()),
    );
    await writeFile(zip, Buffer.from("invalid zip"));
    const before = await readFile(output, "utf8");
    await assert.rejects(updateAppalcart(zip, output));
    assert.equal(await readFile(output, "utf8"), before);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
