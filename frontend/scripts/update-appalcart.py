"""Refresh the map data with python scripts/update-appalcart.py [gtfs.zip]."""

import csv
import io
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from urllib.request import urlopen
from zipfile import ZipFile

FEED = "https://s3.amazonaws.com/etatransit.gtfs/appalcart.etaspot.net/gtfs.zip"


def read_table(archive, name):
    with archive.open(f"{name}.txt") as source:
        return list(csv.DictReader(io.TextIOWrapper(source, encoding="utf-8-sig")))


def feature(kind, coordinates, **properties):
    return {
        "type": "Feature",
        "geometry": {"type": kind, "coordinates": coordinates},
        "properties": properties,
    }


def build_data(archive):
    shapes = defaultdict(list)
    for row in read_table(archive, "shapes"):
        coordinates = [float(row["shape_pt_lon"]), float(row["shape_pt_lat"])]
        shapes[row["shape_id"]].append((int(row["shape_pt_sequence"]), coordinates))

    trip_routes = {}
    route_shapes = defaultdict(set)
    for trip in read_table(archive, "trips"):
        route_id = trip["route_id"]
        trip_routes[trip["trip_id"]] = route_id
        route_shapes[route_id].add(trip["shape_id"])

    stop_routes = defaultdict(set)
    for row in read_table(archive, "stop_times"):
        if row["trip_id"] in trip_routes:
            stop_routes[row["stop_id"]].add(trip_routes[row["trip_id"]])

    routes = []
    features = []
    for row in read_table(archive, "routes"):
        name = row["route_long_name"] or row["route_short_name"]
        normalized_name = name.strip().casefold()
        if normalized_name.startswith("game day ") or "night owl" in normalized_name:
            continue
        route_id = row["route_id"]
        lines = [
            [point for _, point in sorted(shapes[shape_id])]
            for shape_id in sorted(route_shapes[route_id])
            if len(shapes[shape_id]) >= 2
        ]
        if not lines:
            continue
        color = row["route_color"]
        routes.append({"id": route_id, "name": name})
        features.append(feature(
            "MultiLineString", lines, routeIds=[route_id],
            color=f"#{color}" if re.fullmatch(r"[0-9a-fA-F]{6}", color) else "#2563eb",
        ))

    route_ids = {route["id"] for route in routes}
    for row in read_table(archive, "stops"):
        ids = sorted(stop_routes[row["stop_id"]] & route_ids)
        if ids and row["stop_lon"] and row["stop_lat"]:
            coordinates = [float(row["stop_lon"]), float(row["stop_lat"])]
            features.append(feature("Point", coordinates, routeIds=ids, name=row["stop_name"]))

    if not routes or not any(item["geometry"]["type"] == "Point" for item in features):
        raise ValueError("AppalCART feed contains no usable routes or stops")

    return {
        "routes": sorted(routes, key=lambda route: route["name"].casefold()),
        "data": {"type": "FeatureCollection", "features": features},
    }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        feed = Path(sys.argv[1]).read_bytes()
    else:
        with urlopen(FEED, timeout=30) as response:
            feed = response.read()
    with ZipFile(io.BytesIO(feed)) as archive:
        data = build_data(archive)
    output = Path(__file__).resolve().parents[1] / "src/data/appalcart.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
