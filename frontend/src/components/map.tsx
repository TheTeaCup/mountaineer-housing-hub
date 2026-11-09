import { useColorMode } from "@/components/ui/color-mode";
import { useProperties } from "@/hooks/use-properties";
import { mapLocations } from "@/utils/api/properties";
import { registerPMTiles } from "@/utils/pmtiles";
import { Box, Button, Flex, IconButton, Switch, Text } from "@chakra-ui/react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useRouter } from "next/navigation";
import protomaps from "protomaps-themes-base";
import { useEffect, useMemo, useRef, useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

const apartmentIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect x="9" y="5" width="30" height="38" rx="2" fill="#ffc72c" stroke="#111111" stroke-width="4"/><path d="M16 13h5v5h-5zm11 0h5v5h-5zM16 23h5v5h-5zm11 0h5v5h-5z" fill="#111111"/><path d="M20 43V33h8v10" fill="#ffffff" stroke="#111111" stroke-width="3"/></svg>`;
const townhomeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M4 20L13 9l11 11L35 9l9 11v23H4z" fill="#2563eb" stroke="#111111" stroke-width="4" stroke-linejoin="round"/><path d="M24 20v23M10 28h7v6h-7zm21 0h7v6h-7z" fill="#ffffff" stroke="#111111" stroke-width="3"/><path d="M11 43V36h6v7m14 0V36h6v7" fill="#ffffff" stroke="#111111" stroke-width="3"/></svg>`;

export default function MapComponent({
  propertyQuery,
}: {
  propertyQuery?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const viewRef = useRef<{ center: [number, number]; zoom: number } | null>(
    null,
  );
  const router = useRouter();
  const { colorMode } = useColorMode();
  const { properties, loading, error, retry } = useProperties("", 500);
  const [mapError, setMapError] = useState("");
  const [keyOpen, setKeyOpen] = useState(true);
  const [showComplexes, setShowComplexes] = useState(true);
  const [showTownhomes, setShowTownhomes] = useState(true);
  const mapped = useMemo(() => mapLocations(properties), [properties]);
  const focused = mapped.find((property) => property.slug === propertyQuery);
  const visible = mapped.filter((property) =>
    property.property_type === "townhome"
      ? showTownhomes
      : property.property_type === "apartment_complex"
        ? showComplexes
        : true,
  );
  const propertyFilter = useMemo<maplibregl.FilterSpecification>(
    () => [
      "all",
      [
        "any",
        ["!=", ["get", "propertyType"], "apartment_complex"],
        showComplexes,
      ],
      ["any", ["!=", ["get", "propertyType"], "townhome"], showTownhomes],
    ],
    [showComplexes, showTownhomes],
  );
  const filterRef = useRef(propertyFilter);
  useEffect(() => {
    filterRef.current = propertyFilter;
    const map = mapRef.current;
    for (const layer of ["property-icons", "property-labels"]) {
      if (map?.getLayer(layer)) map.setFilter(layer, propertyFilter);
    }
  }, [propertyFilter]);
  useEffect(() => {
    registerPMTiles();
    if (!containerRef.current) return;
    let disposed = false;
    const iconUrls: string[] = [];
    const iconImages: HTMLImageElement[] = [];
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
    mapRef.current = map;
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
            propertyType: property.property_type,
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
      const icons = [
        { name: "apartment", svg: apartmentIcon },
        { name: "townhome", svg: townhomeIcon },
      ];
      let loadedIcons = 0;
      const addPropertyLayers = () => {
        if (disposed) return;
        map.addLayer({
          id: "property-icons",
          type: "symbol",
          source: "properties",
          filter: filterRef.current,
          layout: {
            "icon-image": [
              "match",
              ["get", "propertyType"],
              "townhome",
              "townhome",
              "apartment",
            ],
            "icon-size": 0.55,
            "icon-anchor": "center",
            "icon-allow-overlap": true,
          },
        });
        map.addLayer({
          id: "property-labels",
          type: "symbol",
          source: "properties",
          filter: filterRef.current,
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
      icons.forEach(({ name, svg }) => {
        const iconUrl = URL.createObjectURL(
          new Blob([svg], { type: "image/svg+xml" }),
        );
        const iconImage = new Image();
        iconUrls.push(iconUrl);
        iconImages.push(iconImage);
        iconImage.onload = () => {
          URL.revokeObjectURL(iconUrl);
          if (disposed) return;
          map.addImage(name, iconImage);
          loadedIcons += 1;
          if (loadedIcons === icons.length) addPropertyLayers();
        };
        iconImage.src = iconUrl;
      });
    });
    return () => {
      disposed = true;
      iconImages.forEach((iconImage) => (iconImage.onload = null));
      iconUrls.forEach((iconUrl) => URL.revokeObjectURL(iconUrl));
      // Preserve user navigation when changing theme or refreshing property data.
      if (mapped.length) {
        const center = map.getCenter();
        viewRef.current = {
          center: [center.lng, center.lat],
          zoom: map.getZoom(),
        };
      }
      map.remove();
      if (mapRef.current === map) mapRef.current = null;
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
        p={3}
        boxShadow="md"
      >
        <Flex align="center" justify="space-between" gap={3}>
          <Text fontWeight="semibold">Map key</Text>
          <IconButton
            aria-label={keyOpen ? "Minimize map key" : "Expand map key"}
            aria-expanded={keyOpen}
            aria-controls="map-key-content"
            title={keyOpen ? "Minimize map key" : "Expand map key"}
            size="xs"
            variant="ghost"
            onClick={() => setKeyOpen((open) => !open)}
          >
            {keyOpen ? <LuChevronUp /> : <LuChevronDown />}
          </IconButton>
        </Flex>
        {keyOpen && (
          <Box id="map-key-content" mt={2}>
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
                  ? visible.length
                    ? "Select a marker to view property details."
                    : "No properties match your filters. Turn on a property type below."
                  : "No published properties have map coordinates yet."}
              </Text>
            )}
            {!loading && !error && mapped.length > 0 && (
              <Flex
                as="ul"
                mt={2}
                gap={3}
                direction="column"
                fontSize="sm"
                listStyleType="none"
                p={0}
              >
                <Flex as="li" align="center" gap={2}>
                  <Box
                    w="12px"
                    h="12px"
                    bg="#ffc72c"
                    border="2px solid #111111"
                    borderRadius="2px"
                  />
                  <Switch.Root
                    size="sm"
                    checked={showComplexes}
                    onCheckedChange={({ checked }) => setShowComplexes(checked)}
                    flex="1"
                    justifyContent="space-between"
                  >
                    <Switch.HiddenInput />
                    <Switch.Label>Apartment complexes</Switch.Label>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Root>
                </Flex>
                <Flex as="li" align="center" gap={2}>
                  <Box
                    w="12px"
                    h="12px"
                    bg="#2563eb"
                    border="2px solid #111111"
                    transform="rotate(45deg)"
                  />
                  <Switch.Root
                    size="sm"
                    checked={showTownhomes}
                    onCheckedChange={({ checked }) => setShowTownhomes(checked)}
                    flex="1"
                    justifyContent="space-between"
                  >
                    <Switch.HiddenInput />
                    <Switch.Label>Townhomes</Switch.Label>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Root>
                </Flex>
              </Flex>
            )}
            {!loading && !error && mapped.length > 0 && (
              <Text
                mt={3}
                fontSize="xs"
                color="var(--site-muted)"
                role="status"
                aria-live="polite"
              >
                {visible.length} of {mapped.length} properties shown
                {mapped.some(
                  (property) =>
                    !["apartment_complex", "townhome"].includes(
                      property.property_type,
                    ),
                ) && ". Other rental types remain visible."}
              </Text>
            )}
            <Flex
              mt={3}
              pt={3}
              borderTopWidth="1px"
              borderColor="var(--site-border)"
              align="center"
              gap={2}
              flexWrap="wrap"
            >
              <Switch.Root disabled checked={false} size="sm">
                <Switch.HiddenInput aria-describedby="bus-routes-coming-soon" />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Switch.Label>Bus routes</Switch.Label>
              </Switch.Root>
              <Text
                id="bus-routes-coming-soon"
                fontSize="xs"
                color="var(--site-muted)"
              >
                Coming soon
              </Text>
            </Flex>
            {propertyQuery && !loading && !error && !focused && (
              <Text mt={2} fontSize="sm">
                This property does not have a published map location.
              </Text>
            )}
            {focused &&
              !visible.some((property) => property.id === focused.id) && (
                <Text mt={2} fontSize="sm">
                  This property is hidden by your filters.
                </Text>
              )}
            {mapError && (
              <Text mt={2} fontSize="sm">
                {mapError}
              </Text>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
