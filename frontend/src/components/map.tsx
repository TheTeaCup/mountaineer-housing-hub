import { useColorMode } from "@/components/ui/color-mode";
import { useProperties } from "@/hooks/use-properties";
import { mapLocations } from "@/utils/api/properties";
import { registerPMTiles } from "@/utils/pmtiles";
import { Box, Button, Text } from "@chakra-ui/react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useRouter } from "next/navigation";
import protomaps from "protomaps-themes-base";
import { useEffect, useMemo, useRef, useState } from "react";

const houseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M6 23L24 7L42 23" fill="none" stroke="#111111" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 21V41H38V21" fill="#ffc72c" stroke="#111111" stroke-width="4" stroke-linejoin="round"/><path d="M19 41V29H29V41" fill="white" stroke="#111111" stroke-width="3"/></svg>`;

export default function MapComponent({
  propertyQuery,
}: {
  propertyQuery?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<{ center: [number, number]; zoom: number } | null>(
    null,
  );
  const router = useRouter();
  const { colorMode } = useColorMode();
  const { properties, loading, error, retry } = useProperties("", 500);
  const [mapError, setMapError] = useState("");
  const mapped = useMemo(() => mapLocations(properties), [properties]);
  const focused = mapped.find((property) => property.slug === propertyQuery);
  useEffect(() => {
    registerPMTiles();
    if (!containerRef.current) return;
    let disposed = false;
    let iconUrl: string | undefined;
    let iconImage: HTMLImageElement | undefined;
    const map = new maplibregl.Map({
      container: containerRef.current,
      center: focused
        ? [focused.longitude!, focused.latitude!]
        : viewRef.current?.center || [-81.6746, 36.2168],
      zoom: focused ? 15 : (viewRef.current?.zoom ?? 13),
      style: {
        version: 8,
        sources: {
          protomaps: {
            type: "vector",
            url: "pmtiles://https://assets.parkwayoverlooks.com/map/boone.pmtiles",
          },
        },
        glyphs:
          "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
        sprite: `https://protomaps.github.io/basemaps-assets/sprites/v4/${colorMode}`,
        layers: protomaps(
          "protomaps",
          colorMode === "dark" ? "dark" : "light",
          "en",
        ),
      },
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.on("error", () => {
      if (!disposed)
        setMapError(
          "Some map tiles could not load. Property locations may still be visible.",
        );
    });
    map.on("load", () => {
      if (disposed) return;
      const data: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: mapped.map((property) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [property.longitude!, property.latitude!],
          },
          properties: {
            id: property.id,
            name: property.name,
            slug: property.slug,
          },
        })),
      };
      map.addSource("properties", { type: "geojson", data });
      if (!focused && mapped.length && !viewRef.current) {
        const bounds = new maplibregl.LngLatBounds();
        mapped.forEach((property) =>
          bounds.extend([property.longitude!, property.latitude!]),
        );
        map.fitBounds(bounds, { padding: 65, maxZoom: 14, duration: 0 });
      }
      iconUrl = URL.createObjectURL(
        new Blob([houseIcon], { type: "image/svg+xml" }),
      );
      iconImage = new Image();
      iconImage.onload = () => {
        if (iconUrl) {
          URL.revokeObjectURL(iconUrl);
          iconUrl = undefined;
        }
        if (disposed || !iconImage) return;
        map.addImage("house", iconImage);
        map.addLayer({
          id: "property-icons",
          type: "symbol",
          source: "properties",
          layout: {
            "icon-image": "house",
            "icon-size": 0.55,
            "icon-anchor": "center",
            "icon-allow-overlap": true,
          },
        });
        map.addLayer({
          id: "property-labels",
          type: "symbol",
          source: "properties",
          layout: {
            "text-field": ["get", "name"],
            "text-size": 13,
            "text-anchor": "left",
            "text-offset": [1.5, 0],
          },
          paint: {
            "text-color": colorMode === "dark" ? "#f9fafb" : "#111111",
            "text-halo-color": colorMode === "dark" ? "#121416" : "#ffffff",
            "text-halo-width": 2,
          },
        });
        const openProperty = (
          event: maplibregl.MapMouseEvent & {
            features?: maplibregl.MapGeoJSONFeature[];
          },
        ) => {
          const slug = event.features?.[0]?.properties?.slug;
          if (typeof slug === "string")
            void router.push(`/properties/${encodeURIComponent(slug)}`);
        };
        for (const layer of ["property-icons", "property-labels"]) {
          map.on("click", layer, openProperty);
          map.on("mouseenter", layer, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layer, () => {
            map.getCanvas().style.cursor = "";
          });
        }
      };
      iconImage.src = iconUrl;
    });
    return () => {
      disposed = true;
      if (iconImage) iconImage.onload = null;
      if (iconUrl) URL.revokeObjectURL(iconUrl);
      // Preserve user navigation when changing theme or refreshing property data.
      if (mapped.length) {
        const center = map.getCenter();
        viewRef.current = {
          center: [center.lng, center.lat],
          zoom: map.getZoom(),
        };
      }
      map.remove();
    };
  }, [router, colorMode, mapped, focused]);
  return (
    <Box position="relative" w="100%" h="100%">
      <Box ref={containerRef} w="100%" h="100%" />
      <Box
        position="absolute"
        top={4}
        left={4}
        maxW="min(340px, calc(100% - 80px))"
        bg="var(--site-surface)"
        color="var(--site-fg)"
        borderRadius="lg"
        p={4}
        boxShadow="md"
      >
        {loading ? (
          <Text role="status">Loading property locations…</Text>
        ) : error ? (
          <Box role="alert">
            <Text>{error}</Text>
            <Button size="sm" mt={2} onClick={retry}>
              Try again
            </Button>
          </Box>
        ) : (
          <Text role="status">
            {mapped.length
              ? `${mapped.length} ${mapped.length === 1 ? "property" : "properties"} on the map. Select a house to view details.`
              : "No published properties have map coordinates yet."}
          </Text>
        )}
        {propertyQuery && !loading && !error && !focused && (
          <Text mt={2} fontSize="sm">
            This property does not have a published map location.
          </Text>
        )}
        {mapError && (
          <Text mt={2} fontSize="sm">
            {mapError}
          </Text>
        )}
      </Box>
    </Box>
  );
}
