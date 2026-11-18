import {
  addAppalCartLayers,
  busLayerFilter,
  busLayers,
  busRoutes,
} from "@/components/appalcart-layer";
import { useColorMode } from "@/components/ui/color-mode";
import { useProperties } from "@/hooks/use-properties";
import { mapLocations } from "@/utils/api/properties";
import { registerPMTiles } from "@/utils/pmtiles";
import { Box, Button, Flex, Switch, Text } from "@chakra-ui/react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useRouter } from "next/navigation";
import protomaps from "protomaps-themes-base";
import { useEffect, useMemo, useRef, useState } from "react";
import { LuChevronDown, LuChevronUp, LuLayers } from "react-icons/lu";

const MAP_PREFERENCES_KEY = "mhh:map-layers:v1";

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
  const [keyOpen, setKeyOpen] = useState(false);
  const [showComplexes, setShowComplexes] = useState(true);
  const [showTownhomes, setShowTownhomes] = useState(true);
  const [showBusRoutes, setShowBusRoutes] = useState(false);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>(() =>
    busRoutes.map((route) => route.id),
  );
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(MAP_PREFERENCES_KEY) || "null",
      );
      if (saved && typeof saved === "object") {
        if (typeof saved.showComplexes === "boolean")
          setShowComplexes(saved.showComplexes);
        if (typeof saved.showTownhomes === "boolean")
          setShowTownhomes(saved.showTownhomes);
        if (typeof saved.showBusRoutes === "boolean")
          setShowBusRoutes(saved.showBusRoutes);
        if (typeof saved.keyOpen === "boolean") setKeyOpen(saved.keyOpen);
        if (Array.isArray(saved.selectedRoutes))
          setSelectedRoutes(
            busRoutes
              .filter((route) => saved.selectedRoutes.includes(route.id))
              .map((route) => route.id),
          );
      }
    } catch {
      /* A blocked store or old preference format must not prevent map use. */
    }
    setPreferencesLoaded(true);
  }, []);
  useEffect(() => {
    if (!preferencesLoaded) return;
    try {
      localStorage.setItem(
        MAP_PREFERENCES_KEY,
        JSON.stringify({
          showComplexes,
          showTownhomes,
          showBusRoutes,
          selectedRoutes,
          keyOpen,
        }),
      );
    } catch {
      /* Browsing with storage disabled still supports temporary preferences. */
    }
  }, [
    preferencesLoaded,
    showComplexes,
    showTownhomes,
    showBusRoutes,
    selectedRoutes,
    keyOpen,
  ]);
  const busSelection = useMemo(
    () => (showBusRoutes ? selectedRoutes : []),
    [showBusRoutes, selectedRoutes],
  );
  const busSelectionRef = useRef(busSelection);
  const stopPopup = useRef<maplibregl.Popup | null>(null);
  useEffect(() => {
    busSelectionRef.current = busSelection;
    stopPopup.current?.remove();
    const map = mapRef.current;
    for (const layer of busLayers) {
      if (map?.getLayer(layer)) {
        map.setFilter(layer, busLayerFilter(layer, busSelection));
        map.setLayoutProperty(
          layer,
          "visibility",
          busSelection.length ? "visible" : "none",
        );
      }
    }
  }, [busSelection]);
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
      stopPopup.current = addAppalCartLayers(map, busSelectionRef.current);
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
      stopPopup.current?.remove();
      stopPopup.current = null;
      map.remove();
      if (mapRef.current === map) mapRef.current = null;
    };
  }, [router, colorMode, mapped, focused]);
  return (
    <Box position="relative" w="100%" h="100%">
      <Box ref={containerRef} w="100%" h="100%" />
      <Box
        position="absolute"
        top={{ base: 3, md: 4 }}
        left={{ base: 3, md: 4 }}
        w={keyOpen ? { base: "calc(100% - 76px)", md: "320px" } : "auto"}
        maxW="340px"
        maxH="calc(100% - 24px)"
        overflowY="auto"
        borderWidth="1px"
        borderColor="var(--site-border)"
        bg="var(--site-surface)"
        color="var(--site-fg)"
        borderRadius="lg"
        p={3}
        boxShadow="md"
      >
        <Button
          w="100%"
          minH="44px"
          variant="ghost"
          justifyContent="space-between"
          color="var(--site-fg)"
          px={1}
          aria-expanded={keyOpen}
          aria-controls="map-key-content"
          onClick={() => setKeyOpen((open) => !open)}
        >
          <LuLayers aria-hidden="true" /> Map layers
          <Text as="span" fontSize="xs" color="var(--site-muted)">
            {visible.length} places
          </Text>
          {keyOpen ? <LuChevronUp /> : <LuChevronDown />}
        </Button>
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
                    w="28px"
                    h="28px"
                    flexShrink={0}
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: apartmentIcon }}
                    css={{ "& svg": { width: "100%", height: "100%" } }}
                  />
                  <Switch.Root
                    size="sm"
                    checked={showComplexes}
                    onCheckedChange={({ checked }) => setShowComplexes(checked)}
                    flex="1"
                    minH="44px"
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
                    w="28px"
                    h="28px"
                    flexShrink={0}
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: townhomeIcon }}
                    css={{ "& svg": { width: "100%", height: "100%" } }}
                  />
                  <Switch.Root
                    size="sm"
                    checked={showTownhomes}
                    onCheckedChange={({ checked }) => setShowTownhomes(checked)}
                    flex="1"
                    minH="44px"
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
              <Switch.Root
                checked={showBusRoutes}
                onCheckedChange={({ checked }) => setShowBusRoutes(checked)}
                size="sm"
                w="100%"
                minH="44px"
                justifyContent="space-between"
              >
                <Switch.HiddenInput />
                <Switch.Label>Bus routes</Switch.Label>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
              {showBusRoutes && (
                <>
                  <Box w="100%">
                    <Flex
                      align="center"
                      justify="space-between"
                      gap={2}
                      wrap="wrap"
                      mb={2}
                    >
                      <Text fontSize="sm" role="status">
                        {selectedRoutes.length} routes selected
                      </Text>
                      <Flex gap={1}>
                        <Button
                          size="xs"
                          variant="ghost"
                          minH="44px"
                          color="var(--site-accent-fg)"
                          onClick={() =>
                            setSelectedRoutes(
                              busRoutes.map((route) => route.id),
                            )
                          }
                        >
                          Select all
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          minH="44px"
                          color="var(--site-fg)"
                          onClick={() => setSelectedRoutes([])}
                        >
                          Clear
                        </Button>
                      </Flex>
                    </Flex>
                    <Box
                      as="fieldset"
                      maxH="220px"
                      overflowY="auto"
                      borderWidth="1px"
                      borderColor="var(--site-border)"
                      borderRadius="lg"
                      p={2}
                    >
                      <Box as="legend" px={1} fontSize="sm">
                        Choose bus routes
                      </Box>
                      {busRoutes.map((route) => (
                        <Box
                          as="label"
                          key={route.id}
                          display="flex"
                          alignItems="center"
                          gap={3}
                          minH="44px"
                          px={2}
                          cursor="pointer"
                          borderRadius="md"
                          _hover={{ bg: "var(--site-control-hover)" }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRoutes.includes(route.id)}
                            onChange={(event) =>
                              setSelectedRoutes((current) =>
                                event.target.checked
                                  ? [...current, route.id]
                                  : current.filter((id) => id !== route.id),
                              )
                            }
                            style={{
                              width: 18,
                              height: 18,
                              accentColor: "#ffc72c",
                              flexShrink: 0,
                            }}
                          />
                          <Text fontSize="sm">{route.name}</Text>
                        </Box>
                      ))}
                    </Box>
                    {!selectedRoutes.length && (
                      <Text fontSize="xs" mt={2}>
                        No bus routes selected. Choose a route to show it on the
                        map.
                      </Text>
                    )}
                  </Box>
                  <Text fontSize="xs" color="var(--site-muted)">
                    Select a stop to see which routes serve it.
                  </Text>
                  <Text fontSize="xs" color="var(--site-muted)" w="100%">
                    Data sourced from appalcart.com
                  </Text>
                </>
              )}
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
