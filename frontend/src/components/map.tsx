import { registerPMTiles } from "@/utils/pmtiles";
import { Box } from "@chakra-ui/react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useRouter } from "next/navigation";
import protomaps from "protomaps-themes-base";
import { useEffect, useRef } from "react";

const properties = [
  {
    id: "university-highlands",
    name: "University Highlands",
    slug: "university-highlands",
    coordinates: [-81.7033474, 36.2089686],
  },
  {
    id: "the-standard-at-boone",
    name: "The Standard at Boone",
    slug: "the-standard-at-boone",
    coordinates: [-81.6719444, 36.20725],
  },
  {
    id: "the-finmore",
    name: "The Finmore at 241",
    slug: "the-finmore",
    coordinates: [-81.6615367, 36.2034991],
  },
];

const houseIcon = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="48"
  height="48"
  viewBox="0 0 48 48"
>
  <path
    d="M6 23L24 7L42 23"
    fill="none"
    stroke="#111111"
    stroke-width="4"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <path
    d="M10 21V41H38V21"
    fill="#ffc72c"
    stroke="#111111"
    stroke-width="4"
    stroke-linejoin="round"
  />

  <path
    d="M19 41V29H29V41"
    fill="white"
    stroke="#111111"
    stroke-width="3"
  />
</svg>
`;

export default function MapComponent({
  propertyQuery,
}: {
  propertyQuery?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    registerPMTiles();

    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,

      // Boone, NC
      center: [-81.6746, 36.2168],

      zoom: 13,

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

        sprite: "https://protomaps.github.io/basemaps-assets/sprites/v4/light",

        layers: protomaps("protomaps", "light", "en"),
      },
    });

    map.on("load", () => {
      /*
       * Convert properties into GeoJSON
       */
      const propertyGeoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: properties.map((property) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: property.coordinates,
          },
          properties: {
            id: property.id,
            name: property.name,
            slug: property.slug,
          },
        })),
      };

      /*
       * Add property source
       */
      map.addSource("properties", {
        type: "geojson",
        data: propertyGeoJSON,
      });

      /*
       * Add house icon
       */
      const svg = new Blob([houseIcon], {
        type: "image/svg+xml",
      });

      const iconUrl = URL.createObjectURL(svg);
      const image = new Image();

      image.onload = () => {
        /*
         * Register the house icon
         */
        if (!map.hasImage("house")) {
          map.addImage("house", image);
        }

        URL.revokeObjectURL(iconUrl);

        /*
         * House markers
         */
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

        /*
         * Property names
         */
        map.addLayer({
          id: "property-labels",
          type: "symbol",
          source: "properties",

          layout: {
            "text-field": ["get", "name"],
            "text-size": 13,
            "text-anchor": "left",
            "text-offset": [1.5, 0],
            "text-allow-overlap": false,
          },

          paint: {
            "text-color": "#111111",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          },
        });

        /*
         * Property click handler
         */
        const handlePropertyClick = (
          event: maplibregl.MapMouseEvent & {
            features?: maplibregl.MapGeoJSONFeature[];
          },
        ) => {
          const feature = event.features?.[0];

          if (!feature) return;

          const slug = feature.properties?.slug;

          if (!slug) return;

          router.push(`/properties/${slug}`);
        };

        map.on("click", "property-icons", handlePropertyClick);
        map.on("click", "property-labels", handlePropertyClick);

        /*
         * Change cursor when hovering over house
         */
        map.on("mouseenter", "property-icons", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "property-icons", () => {
          map.getCanvas().style.cursor = "";
        });

        /*
         * Change cursor when hovering over name
         */
        map.on("mouseenter", "property-labels", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "property-labels", () => {
          map.getCanvas().style.cursor = "";
        });
      };

      image.src = iconUrl;
    });

    return () => {
      map.remove();
    };
  }, [router]);

  return <Box ref={containerRef} w="100%" h="100%" />;
}
